/// <reference path="../../../../typings/index.d.ts" />

import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {PGManager, PGQueryReturn} from "../../../../db/implementation/postgres/manager";
import Promise = require("promise");
import {DBTables, getTableName} from "../../../../db/abstraction/tables/base_table";
import {EnumExt} from "../../../../card_service/base_classes/items/card";

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

/**
 * Delete the database tables
 * @param {PGManager} the Postgres database connection manager
 */
function deleteTables(pgManager: PGManager): Promise<PGQueryReturn> {
    return new Promise((resolve, reject) => {
        // Delete the tables by dropping the schema then re-creating it
        var query = `
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
        `.trim();
        pgManager.runQuery(query)
            .then((result: PGQueryReturn) => { resolve(result); })
            .catch((result: PGQueryReturn) => { reject(result); });
    });
}

/**
 * Validate that the database tables exist
 * @param {PGManager} the Postgres database connection manager
 * @returns {Promise<string>} resolve with an empty message, reject with an error message indicating which tables do not exist
 * @note this method always resolves, never rejects
 */
function checkTablesExist(pgManager: PGManager): Promise<string> {
    return new Promise((resolve) => {
        var promises:Array<Promise<PGQueryReturn>> = [];
        var message = [];
        for (var table of EnumExt.getValues(DBTables)) {
            promises.push(checkTableExistsHelper(pgManager, table));
        }
        Promise.all(promises).then((values:Array<PGQueryReturn>) => {
            for (let ix = 0; ix < values.length; ix++) {
                let result:PGQueryReturn = values[ix];
                if (result.value.rowCount != 1) {
                    let err = `Command failed: ${result.value.command}`;
                    if (result.error.length > 0) {
                        err = err.concat(`, error: ${result.error}`);
                    }
                    message.push(err)
                }
            }
            // Join all messages together with a newline and remove the last newline
            resolve(message.join("\n").replace(/\n$/, ""));
        });
    });
}
/**
 * Helper function to check if a database table exists
 * @param pgManager{PGManager} the Postgres connection manager
 * @param table {DBTables} the database table to check
 * @note this table always resolves, never rejects
 */
function checkTableExistsHelper(pgManager:PGManager, table:DBTables): Promise<PGQueryReturn> {
    return new Promise((resolve) => {
        // Check if a table exists by selecting it
        var query = `SELECT to_regclass('public.${getTableName(table)}')`;
        pgManager.runQuery(query)
            .then((result: PGQueryReturn) => { resolve(result); });
    });
}

describe("Test creating the database tables", function() {
    var pgManager;
    beforeEach(function(done) {
        setAllConfig();
        pgManager = new PGManager();
        // Asynchronously drop the schema
        deleteTables(pgManager).then(done());
    });
    it("can create the database tables", function(done) {
        PostgresTables.createTables()
            .then((message:string) => {
                if (message.length > 0) {
                    done.fail(message);
                }
                else {
                    // We claim to have created the tables, now check for sure
                    checkTablesExist(pgManager)
                        .then((message:string) => {
                            if (message.length > 0) {
                                done.fail(message);
                            }
                            else {
                                done();
                            }
                        });
                }
            });
    });
});