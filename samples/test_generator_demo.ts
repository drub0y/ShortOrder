import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
// import * as yaml from 'js-yaml';

import { PID } from 'prix-fixe';

import {
    AnyToken,
    Catalog,
    createTestCase,
    explainDifferences,
    formatInstanceAsText,
    Quantity,
    Random,
    RandomOrders,
    RandomProducts,
    setup,
    TestSuite,
    TokenizerFunction,
    testOrdersIdentical,
    formatInstanceDebug
} from '../src';

function setOptionOfPredicate(catalog: Catalog, child: PID, parent: PID) {
    const childInfo = catalog.get(child);
    const parentInfo = catalog.get(parent);

    return parentInfo.standalone && !childInfo.standalone;
}

function usage() {
    console.log(`TODO: print usage here.`);
}

async function go() {
    // const args = minimist(process.argv.slice(2));

    // if (args._.length !== 1) {
    //     const message = 'Expected output file on command line.';
    //     console.log(message);
    //     usage();
    //     return;
    // }

    // const outfile = args._[0];

    const world = setup(
        path.join(__dirname, './data/restaurant-en/menu.yaml'),
        path.join(__dirname, './data/restaurant-en/intents.yaml'),
        path.join(__dirname, './data/restaurant-en/attributes.yaml'),
        path.join(__dirname, './data/restaurant-en/quantifiers.yaml'),
        path.join(__dirname, './data/restaurant-en/units.yaml'),
        path.join(__dirname, './data/restaurant-en/stopwords.yaml'),
        false
    );

    world.catalog.setOptionOfPredicate(setOptionOfPredicate);

    // Set up tokenizer
    const tokenizer: TokenizerFunction = async (utterance: string): Promise<IterableIterator<AnyToken>> =>
        (world.unified.processOneQuery(utterance) as AnyToken[]).values();


    const entityQuantities: Quantity[] = [
        { value: 1, text: 'a' },
        { value: 1, text: 'one' },
        { value: 2, text: 'two' }
    ];

    const optionQuantities: Quantity[] = [
        { value: 0, text: 'no' },
        { value: 0, text: 'without [any]' },
        { value: 1, text: '' },
        { value: 1, text: 'a (pump,squirt) [of]' },
        { value: 1, text: 'some' },
        { value: 1, text: 'one (pump,squirt) [of]' },
        { value: 2, text: 'two (pumps,squirts) [of]' }
    ];

    const prologueAliases = [
        "(I'd,I would) like",
        "(I'll,I will) (do,get,have,take)",
        "[please] (get,give) me",
        "could I (have,get)"
    ];

    const epilogueAliases = [
        "that's (all,it)",
        "[and] (that'll,that will) (do it,be all)",
        "thanks",
        "thank you"
    ];

    //
    // Generate and print a selection of utterances.
    //
    const optionIds = [200000, 200001];

    const random = new Random('seed1');
    const randomProducts = new RandomProducts(
        world.catalog,
        world.attributeInfo,
        world.attributes,
        entityQuantities,
        optionIds,
        optionQuantities,
        random);

    const orders = new RandomOrders(prologueAliases, randomProducts, epilogueAliases);
    let counter = 0;
    const limit = 50;
    let passedCount = 0;
    let failedCount = 0;

    for (const instances of orders.orders()) {
        if (counter >= limit) {
            break;
        }
        counter++;
        const text = instances.map(formatInstanceAsText).join(' ');
        console.log(text);
        // console.log(instances.map(formatInstanceDebug).join(' '));

        const testCase = createTestCase(world.catalog, world.attributeInfo, instances);
        const result = await testCase.run(world, tokenizer);
        // console.log(`Test status: ${result.passed?"PASSED":"FAILED"}`);

        const ok = testOrdersIdentical(testCase.expected[0], result.observed[0]);
        console.log(`Test status: ${ok ? "PASSED" : "FAILED"}`);
        if (ok) {
            passedCount++;
        }
        else {
            failedCount++;
        }
        console.log('');

        // if (!result.passed) {
        // if (!ok) {
        //         explainDifferences(result.observed[0], testCase.expected[0]);
        // }

        console.log();
    }

    console.log('');
    console.log(`failed: ${failedCount}`);
    console.log(`passed: ${passedCount}`);
    console.log(`fraction: ${passedCount}/${passedCount + failedCount}`);

    // // Set up tokenizer
    // const tokenizer: TokenizerFunction = async (utterance: string): Promise<IterableIterator<AnyToken>> =>
    //     (world.unified.processOneQuery(utterance) as AnyToken[]).values();

    // // Run test suite to get new baseline.
    // const priority = 0;
    // const suites: string[] = [];
    // const results = await TestSuite.fromInputLines(
    //     world,
    //     tokenizer,
    //     lines,
    //     priority,
    //     suites);

    // const yamlText = yaml.safeDump(results, { noRefs: true });

    // const outfilePath = path.resolve(__dirname, outfile);
    // fs.writeFileSync(outfilePath, yamlText, 'utf-8');

    // console.log(`Rebased to "${outfilePath}"`);
}

go();
