import {
    Alias,
    generateAliases,
    Lexicon,
    Token,
    Tokenizer,
} from 'token-flow';

import { matcherFromExpression, patternFromExpression} from './unified';

export interface FuzzyItem {
    id: number;
    pattern: string;
}

export interface FuzzyMatch {
    id: number;
    score: number;
}

export class FuzzyTextMatcher {
    private readonly lexicon: Lexicon;
    private readonly tokenizer: Tokenizer;

    constructor(items: IterableIterator<FuzzyItem>) {
        this.lexicon = new Lexicon();

        const debugMode = false;
        this.tokenizer = new Tokenizer(
            this.lexicon.termModel,
            this.lexicon.numberParser,
            debugMode
        );

        this.lexicon.addDomain(AliasesFromFuzzyItems(items));
        this.lexicon.ingest(this.tokenizer);
    }

    matches(query: string): FuzzyMatch[] {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        const tokens: FuzzyMatch[] = [];
        for (const [index, edge] of path.entries()) {
            const token = this.tokenizer.tokenFromEdge(edge) as FuzzyToken;
            if (token.type === FUZZY) {
                tokens.push({ id: token.id, score: edge.score });
            }
        }

        // TODO: check sort order
        return tokens.sort( (a: FuzzyMatch, b: FuzzyMatch) => b.score - a.score);
    }
}

const FUZZY: unique symbol = Symbol('FUZZY');
type FUZZY = typeof FUZZY;

interface FuzzyToken extends Token {
    type: FUZZY;
    id: number;
}

function* AliasesFromFuzzyItems(items: IterableIterator<FuzzyItem>): IterableIterator<Alias> {
    for (const item of items) {
        const token: FuzzyToken = { type: FUZZY, id: item.id };
        const matcher = matcherFromExpression(item.pattern);
        const pattern = patternFromExpression(item.pattern);
        for (const text of generateAliases(pattern)) {
            yield { token, text, matcher };
        }
    }
}
