/// <reference path="../../typings/index.d.ts" />

import {setup} from "../../app";
import {createNewServer} from "./setup";

"use strict";

var request = require("supertest"),
    expect  = require("expect");

describe("Run the app", function() {
    /*
     Before each test, make sure to create a fresh instance of the application
     in order to ensure the state of the server is reset between each test run
     */
    beforeEach(function() {
        createNewServer(this);
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