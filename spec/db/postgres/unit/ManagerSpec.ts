/// <reference path="../../../../typings/index.d.ts" />
import {pg_mgr, PGManagerStrings} from "../../../../db/implementation/postgres/manager";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
var Q = require("q");

/**
 * Set dummy environment variables that the PG manager expects
 */
function setAllConfig() {
    process.env.PG_HOST = "localhost";
    process.env.PG_PORT = 5432;
    process.env.PG_DB = "sometable";
    process.env.PG_USER = "user";
    process.env.PG_PASS = "hello5";
}

describe("Test the Postgres Database manager", function() {
    beforeEach(function() {
        setAllConfig();
        pg_mgr.config = null;
    });
    describe("Test reading the configuration", function() {
        it("throws an exception if the host is not set", function() {
            process.env.PG_HOST = "";
            expect(pg_mgr.readConfig.bind(pg_mgr)).toThrow(PGManagerStrings.HostError);
        });
        it("throws an exception if the port is not set", function() {
            process.env.PG_PORT = "";
            expect(pg_mgr.readConfig.bind(pg_mgr)).toThrow(PGManagerStrings.PortError);
        });
        it("throws an exception if the database is not set", function() {
            process.env.PG_DB = "";
            expect(pg_mgr.readConfig.bind(pg_mgr)).toThrow(PGManagerStrings.DatabaseError);
        });
        it("throws an exception if the user is not set", function() {
            process.env.PG_USER = "";
            expect(pg_mgr.readConfig.bind(pg_mgr)).toThrow(PGManagerStrings.UserError);
        });
        it("throws an exception if the password is not set", function() {
            process.env.PG_PASS = "";
            expect(pg_mgr.readConfig.bind(pg_mgr)).toThrow(PGManagerStrings.PasswordError);
        });
        it("initializes the database tables during init()", function(done) {
            spyOn(PostgresTables, "createModels").and.callFake(() => {
                return new Q.Promise((resolve) => { resolve(""); });
            });
            pg_mgr.init()
                .then(() => {
                    expect(PostgresTables.createModels).toHaveBeenCalled();
                })
                .finally(() => { done(); });
        });
        it("returns errors that occur during initialization", function(done) {
            pg_mgr.init()
                .then(() => {
                    expect(false).toBe(true, "Initialization should have failed");
                })
                .catch((err:string) => {
                    expect(err.length).toBeGreaterThan(0, "Initialization should've failed with an error string");
                })
                .finally(() => { done(); });
        });
    });
});