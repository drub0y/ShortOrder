import * as Debug from 'debug';
import * as path from 'path';
import { stemmerConfusionMatrix } from 'token-flow';

import { Unified } from '../src/unified';

function stemmerConfusionDemo() {
    Debug.enable('tf-interactive,tf:*');

    console.log('Stemmer Confusion Matrix');
    console.log();

    const unified = new Unified(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        path.join(__dirname, './data/restaurant-en/stopwords.yaml'),
        true);

    const matrix = stemmerConfusionMatrix(unified.lexicon);

    let entryCount = 0;
    let collisionCount = 0;
    for (const [key, value] of Object.entries(matrix)) {
        ++entryCount;
        if (value.size > 1) {
            ++collisionCount;
            const values = [...value].join(',');
            console.log(`"${key}": [${values}]`);
        }
    }

    console.log();
    console.log(`${entryCount} unique stemmed terms`);
    console.log(`${collisionCount} collisions`);
}

stemmerConfusionDemo();
