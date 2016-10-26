/// <reference path="../../typings/index.d.ts" />

import {createNewServer} from "./setup";

"use strict";
import {deleteTables} from "../db/postgres/integration/CreateTablesSpec";

var request = require("supertest"),
    expect  = require("expect");

describe("Run the app", function() {
    /*
     Before all the tests run, make sure to create a fresh instance of the application
     in order to ensure the state of the server is reset between each test run. Also
     ensure that the database tables are created
     */
    beforeEach(function(done) {
        // Asynchronously drop the schema
        deleteTables()
            .then(() => {
                return createNewServer(this);
            })
            .finally(() => { done(); });
    });
    // After all the tests have run, drop the tables
    afterEach(function(done) {
        // Asynchronously drop the schema
        deleteTables().finally(() => { done(); });
    });

    it("responds to /", function(done) {
        request(this.app)
            .get("/")
            .expect(200, done);
    });
    it("resets state between tests: set x equal to zero", function() {
        this.app.locals.x = 0;
    });
    it("resets state between tests", function() {
        expect(this.app.locals.x).toNotExist();
    });
    it("returns 404 for unknown routes", function(done) {
        request(this.app)
            .get("/foo/bar")
            .expect(404, done);
    });
});