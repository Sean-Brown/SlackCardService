/// <reference path="../../../../typings/index.d.ts" />
import {PGManager} from "../../../../db/implementation/postgres/manager";

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
    var pgManager;
    beforeEach(function() {
        setAllConfig();
        pgManager = new PGManager();
    });
    describe("Test reading the configuration", function() {
        it("throws an exception if the host is not set", function() {
            process.env.PG_HOST = "";
            expect(pgManager.readConfig.bind(pgManager)).toThrow(PGManager.HostError);
        });
        it("throws an exception if the port is not set", function() {
            process.env.PG_PORT = "";
            expect(pgManager.readConfig.bind(pgManager)).toThrow(PGManager.PortError);
        });
        it("throws an exception if the database is not set", function() {
            process.env.PG_DB = "";
            expect(pgManager.readConfig.bind(pgManager)).toThrow(PGManager.DatabaseError);
        });
        it("throws an exception if the user is not set", function() {
            process.env.PG_USER = "";
            expect(pgManager.readConfig.bind(pgManager)).toThrow(PGManager.UserError);
        });
        it("throws an exception if the password is not set", function() {
            process.env.PG_PASS = "";
            expect(pgManager.readConfig.bind(pgManager)).toThrow(PGManager.PasswordError);
        });
    });
});