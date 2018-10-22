import * as fs from 'fs';
import { indexFromYamlString, Item, PatternRecognizer, PID, StemmerFunction, Token, Tokenizer } from '../../src/tokenizer';

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    text: string;
    pid: PID;
    name: string;
}

export type EntityRecognizer = PatternRecognizer<Item>;

export function CreateEntityRecognizer(
    entityFile: string,
    badWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false) {
    const index = indexFromYamlString(fs.readFileSync(entityFile, 'utf8'));

    const tokenFactory = (pid: PID, text: string): EntityToken => {
        const name = index.items[pid].name;
        return { type: ENTITY, pid, name, text };
    };

    return new PatternRecognizer(index, tokenFactory, badWords, stemmer, debugMode);
}