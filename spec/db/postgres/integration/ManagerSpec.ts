/// <reference path="../../../../typings/index.d.ts" />
import {pg_mgr, PGConnectionReturn, PGQueryReturn} from "../../../../db/implementation/postgres/manager";

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
    beforeEach(function() {
        setAllConfig();
        pg_mgr.config = null;
    });
    it("can connect to Postgres", function(done) {
        pg_mgr.connect().then((result: PGConnectionReturn) => {
            // connected successfully, now terminate the connection
            expect(result.value).not.toBeNull();
            result.value.end();
            done();
        }).catch((result: PGConnectionReturn) => {
            done.fail(`Expected the test to succeed, instead got: ${result.error}`);
        });
    });
    it("reads the configuration before connecting if the configuration has not been read", function(done) {
        pg_mgr.config = null;
        spyOn(pg_mgr, "readConfig").and.callThrough();
        pg_mgr.connect().then((result: PGConnectionReturn) => {
            expect(result.value).not.toBeNull();
            result.value.end(); // End the connection to Postgres
            expect(pg_mgr.readConfig).toHaveBeenCalled();
            done();
        }).catch((result: PGQueryReturn) => {
            // We should have an error message
            expect(result.error.length).not.toBeLessThan(1);
            // Make the test fail
            done.fail(`Expected the test to succeed, instead got: ${result.error}`);
        });
    });
});
