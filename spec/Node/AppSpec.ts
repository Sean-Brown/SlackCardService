import * as expect from 'expect';
import {Application} from 'express';
import {request} from 'supertest';
import truncate from '../db/postgres/integration/truncate';
import {createNewServer} from './setup';

describe('Run the app', function () {
    const app: Application = null;
    /*
     Before all the tests run, make sure to create a fresh instance of the application
     in order to ensure the state of the server is reset between each test run. Also
     ensure that the database tables are created
     */
    beforeEach(async function () {
        // Asynchronously drop the schema
        await truncate();
        await createNewServer(app);
    });
    // After all the tests have run, drop the tables
    afterEach(async function () {
        // Asynchronously drop the schema
        await truncate();
    });

    it('responds to /', function (done) {
        request(app)
            .get('/')
            .expect(200, done);
    });
    it('resets state between tests: set x equal to zero', function () {
        app.locals.x = 0;
    });
    it('resets state between tests', function () {
        expect(app.locals.x).toNotExist();
    });
    it('returns 404 for unknown routes', function (done) {
        request(app)
            .get('/foo/bar')
            .expect(404, done);
    });
});
