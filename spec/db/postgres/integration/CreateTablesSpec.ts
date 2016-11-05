/// <reference path="../../../../typings/index.d.ts" />

import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {PGQueryReturn, pg_mgr} from "../../../../db/implementation/postgres/manager";
import {DBTables, getTableName} from "../../../../db/abstraction/tables/base_table";
import {EnumExt} from "../../../../card_service/base_classes/items/card";
import {readConfigFromEnv} from "./setEnv";
import {DefaultTeams} from "../../../../db/implementation/default_teams";
import {getErrorMessage} from "../../../../routes/lib";
var Q = require("q");

/**
 * Delete the database tables
 * @param {PGManager} the Postgres database connection manager
 */
export function deleteTables(): Q.Promise<PGQueryReturn> {
    return new Q.Promise((resolve, reject) => {
        // Delete the tables by dropping the schema then re-creating it
        var query = `
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
        `.trim();
        pg_mgr.runQuery(query)
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
function checkTablesExist(): Q.Promise<string> {
    return new Q.Promise((resolve) => {
        var promises:Array<Q.Promise<PGQueryReturn>> = [];
        var message = [];
        for (var table of EnumExt.getValues(DBTables)) {
            promises.push(checkTableExistsHelper(table));
        }
        Q.Promise.all(promises).then((values:Array<PGQueryReturn>) => {
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
            resolve(getErrorMessage(message));
        });
    });
}
/**
 * Helper function to check if a database table exists
 * @param table {DBTables} the database table to check
 * @note this table always resolves, never rejects
 */
function checkTableExistsHelper(table:DBTables): Q.Promise<PGQueryReturn> {
    return new Q.Promise((resolve) => {
        // Check if a table exists by selecting it
        var query = `SELECT to_regclass('public.${getTableName(table)}')`;
        pg_mgr.runQuery(query)
            .then((result: PGQueryReturn) => { resolve(result); });
    });
}
function checkTeamsExist(): Q.Promise<string> {
    return new Q.Promise((resolve) => {
        var promises:Array<Q.Promise<PGQueryReturn>> = [];
        var message = [];
        promises.push(checkTeamExistsHelper(DefaultTeams.red));
        promises.push(checkTeamExistsHelper(DefaultTeams.green));
        promises.push(checkTeamExistsHelper(DefaultTeams.blue));
        Q.Promise.all(promises).then((values:Array<PGQueryReturn>) => {
            for (let ix = 0; ix < values.length; ix++) {
                let result:PGQueryReturn = values[ix];
                if (result.error.length > 0) {
                    message.push(result.error);
                }
                else {
                    expect(result.value.rows.length).toEqual(1);
                }
            }
        });
        // Join all messages together with a newline and remove the last newline
        resolve(getErrorMessage(message));
    });
}
function checkTeamExistsHelper(team:string): Q.Promise<PGQueryReturn> {
    return new Q.Promise((resolve) => {
        var query = `SELECT * FROM ${getTableName(DBTables.Team)} WHERE name='${team}';`;
        pg_mgr.runQuery(query)
            .then((result: PGQueryReturn) => { resolve(result); });
    });
}

describe("Test creating the database tables", function() {
    beforeEach(function(done) {
        readConfigFromEnv();
        pg_mgr.config = null;
        // Asynchronously drop the schema
        deleteTables().then(() => { done(); });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().then(() => { done(); });
    });
    it("can create the database tables", function(done) {
        PostgresTables.createTables()
            .then((message:string) => {
                if (message.length > 0) {
                    done.fail(message);
                }
                else {
                    // We claim to have created the tables, now check for sure
                    checkTablesExist()
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
    it("creates the default teams", function(done) {
        PostgresTables.createTables()
            .then((message:string) => {
                if (message.length > 0) {
                    done.fail(message);
                }
                else {
                    // Check for the default teams
                    checkTeamsExist()
                        .then((message:string) => {
                            if (message.length > 0) {
                                done.fail(message);
                            }
                            else {
                                done();
                            }
                        });
                }
            })
    });
});