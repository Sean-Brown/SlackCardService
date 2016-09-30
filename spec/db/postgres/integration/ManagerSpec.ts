/// <reference path="../../../../typings/index.d.ts" />
import {PGManager, PGConnectionReturn, PGQueryReturn} from "../../../../db/implementation/postgres/manager";

/**
 * Set the environment variables to point to an existing installation of Postgres
 * TODO refactor into a .env file
 */
function setAllConfig() {
    process.env.PG_HOST = "localhost";
    process.env.PG_PORT = 5432;
    process.env.PG_DB = "slackcardservice";
    process.env.PG_USER = "postgres";
    process.env.PG_PASS = "pghello5";
}

describe("Test the Postgres Database manager", function() {
    var pgManager;
    beforeEach(function() {
        setAllConfig();
        pgManager = new PGManager();
    });
    it("can connect to Postgres", function(done) {
        var promise = pgManager.connect();
        promise.then((result: PGConnectionReturn) => {
            // connected successfully, now terminate the connection
            expect(result.value).not.toBeNull();
            result.value.end();
            done();
        }).catch((result: PGConnectionReturn) => {
            done.fail(`Expected the test to succeed, instead got: ${result.error}`);
        });
    });
    it("reads the configuration before performing a query if the configuration has not been read", function(done) {
        pgManager.config = null;
        spyOn(pgManager, "readConfig").and.callThrough();
        var promise = pgManager.runQuery("SELECT * FROM Player");
        promise.then((result: PGQueryReturn) => {
            expect(result.value).not.toBeNull();
            expect(pgManager.readConfig).toHaveBeenCalled();
            done();
        }).catch((result: PGQueryReturn) => {
            // We should have an error message
            expect(result.error.length).not.toBeLessThan(1);
            // Make the test fail
            done.fail(`Expected the test to succeed, instead got: ${result.error}`);
        });
    });
});
