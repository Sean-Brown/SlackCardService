/// <reference path="../../../../typings/index.d.ts" />
import {pg_mgr, PGManagerStrings} from "../../../../db/implementation/postgres/manager";

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
    });
});