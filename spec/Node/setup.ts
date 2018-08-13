import * as express from 'express';
import * as Mocha from 'mocha';
import {setup} from '../../app';
import {readConfigFromEnv} from '../db/setEnv';

export interface TestClass extends Mocha.Test {
    app: express.Application;
}

export async function createNewServer(app: express.Application): Promise<void> {
    try {
        readConfigFromEnv();
        app = await setup(express());
    }
    catch (e) {
        console.error(`Error caught creating a new test server: ${e}`);
        app = null;
    }
}
