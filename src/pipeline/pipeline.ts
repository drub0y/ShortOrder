import { CompositeRecognizer } from '../recognizers';
import { ATTRIBUTE, AttributeRecognizer, AttributeToken, CreateAttributeRecognizer } from '../recognizers';
import { ENTITY, CreateEntityRecognizer, EntityRecognizer, EntityToken } from '../recognizers';
import { INTENT, CreateIntentRecognizer, IntentRecognizer, IntentToken } from '../recognizers';
import { QUANTITY, CreateQuantityRecognizer, NumberRecognizer, QuantityRecognizer, QuantityToken } from '../recognizers';
import { Token, UnknownToken, UNKNOWN } from '../tokenizer';


type AnyToken = UnknownToken | AttributeToken | EntityToken | IntentToken | QuantityToken;

export function tokenToString(t:Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ATTRIBUTE:${attribute}(${token.id})`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ENTITY:${entity}(${token.pid})`;
            break;
        case INTENT:
            name = `INTENT:${token.name}`;
            break;
        case QUANTITY:
            name = `QUANTITY(${token.value})`;
            break;
        default:
            name = 'UNKNOWN';
    }
    return `[${name}]`;
}

export function printToken(t:Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ATTRIBUTE: ${attribute}(${token.id})`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `ENTITY: ${entity}(${token.pid})`;
            break;
        case INTENT:
            name = `INTENT: ${token.name}`;
            break;
        case QUANTITY:
            name = `QUANTITY: ${token.value}`;
            break;
        default:
            name = 'UNKNOWN';
    }
    console.log(`${name}: "${token.text}"`);
}

export function printTokens(tokens:Token[]) {
    tokens.forEach(printToken);
    console.log();
}

export class Pipeline {
    attributeRecognizer: AttributeRecognizer;
    entityRecognizer: EntityRecognizer;
    intentRecognizer: IntentRecognizer;
    numberRecognizer: NumberRecognizer;
    quantityRecognizer: QuantityRecognizer;

    compositeRecognizer: CompositeRecognizer;

    constructor(entityFile: string, intentsFile: string, attributesFile: string, quantifierFile: string) {
        this.attributeRecognizer = CreateAttributeRecognizer(attributesFile);
        this.entityRecognizer = CreateEntityRecognizer(entityFile);
        this.intentRecognizer = CreateIntentRecognizer(intentsFile);   
        this.numberRecognizer = new NumberRecognizer();
        this.quantityRecognizer = CreateQuantityRecognizer(quantifierFile);

        this.compositeRecognizer = new CompositeRecognizer(
            [
                this.entityRecognizer.apply,
                this.attributeRecognizer.apply,
                this.numberRecognizer.apply,
                this.quantityRecognizer.apply,
                this.intentRecognizer.apply
            ],
            false   // debugMode
        );
    }

    processOneQuery(query:string, debugMode = false) {
        const input = {type: UNKNOWN, text: query};
        const tokens = this.compositeRecognizer.apply(input);
        return tokens;
    }
}
