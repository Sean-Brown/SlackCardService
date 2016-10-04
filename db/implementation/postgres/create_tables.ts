/// <reference path="../../../typings/index.d.ts" />

import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "./manager";
import async   = require("async");
var Q = require("q");

export module PostgresTables {
    function primaryKey():string {
        return "id SERIAL PRIMARY KEY";
    }
    export function utcTimestamp():string {
        return "(CURRENT_TIMESTAMP at time zone 'UTC')";
    }
    function defaultTimestamp():string {
        return `without time zone DEFAULT ${utcTimestamp()}`;
    }
    function notNullUniqueLengthCheck(column:string): string {
        return `UNIQUE NOT NULL CHECK (char_length(${column}) > 0)`;
    }
    function notNullLengthCheck(column:string): string {
        return `NOT NULL CHECK (char_length(${column}) > 0)`;
    }
    function createGameTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                CREATE TABLE IF NOT EXISTS ${getTableName(DBTables.Game)} 
                (
                    ${primaryKey()},
                    name varchar(128) ${notNullUniqueLengthCheck("name")}
                );
            `.trim();
            pg_mgr.runQuery(query).then((result:PGQueryReturn) => { resolve(result); });
        });
    }
    function createGameHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                CREATE TABLE IF NOT EXISTS ${getTableName(DBTables.GameHistory)} 
                (
                    ${primaryKey()},
                    game_id integer REFERENCES ${getTableName(DBTables.Game)},
                    began timestamp ${defaultTimestamp()},
                    ended timestamp
                );
            `.trim();
            pg_mgr.runQuery(query).then((result:PGQueryReturn) => { resolve(result); });
        });
    }
    function createGameHistoryPlayerPivotTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                CREATE TABLE IF NOT EXISTS ${getTableName(DBTables.GameHistoryPlayer)} 
                (
                    ${primaryKey()},
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)}
                );
            `.trim();
            pg_mgr.runQuery(query).then((result:PGQueryReturn) => { resolve(result); });
        });
    }
    function createHandHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                CREATE TABLE IF NOT EXISTS ${getTableName(DBTables.HandHistory)} 
                (
                    ${primaryKey()},
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)},
                    hand varchar(128) ${notNullLengthCheck("hand")},
                    cut varchar(4) ${notNullLengthCheck("cut")},
                    received timestamp ${defaultTimestamp()}
                );
            `.trim();
            pg_mgr.runQuery(query).then((result:PGQueryReturn) => { resolve(result); });
        });
    }
    function createPlayerTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                CREATE TABLE IF NOT EXISTS ${getTableName(DBTables.Player)} 
                (
                    ${primaryKey()},
                    name varchar ${notNullUniqueLengthCheck("name")},
                    joined timestamp ${defaultTimestamp()}
                );
            `.trim();
            pg_mgr.runQuery(query).then((result:PGQueryReturn) => { resolve(result); });
        });
    }
    function createWinLossHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                CREATE TABLE IF NOT EXISTS ${getTableName(DBTables.WinLossHistory)} 
                (
                    ${primaryKey()},
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)},
                    won boolean DEFAULT FALSE
                );
            `.trim();
            pg_mgr.runQuery(query).then((result:PGQueryReturn) => { resolve(result); });
        });
    }

    /**
     * Create the tables in the database, return a promise that will return a
     * string containing any error messages.
     */
    export function createTables(): Q.Promise<string> {
        return new Q.Promise((resolve) => {
            var message = [];
            // Make this asynchronous list of tasks run in sequence so the tables get created correctly
            var series = [
                (cb) => {
                    createGameTable().then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            message.push(`error: ${result.error}`);
                        }
                        cb();
                    });
                },
                (cb) => {
                    createPlayerTable().then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            message.push(`error: ${result.error}`);
                        }
                        cb();
                    });
                },
                (cb) => {
                    createGameHistoryTable().then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            message.push(`error: ${result.error}`);
                        }
                        cb();
                    });
                },
                (cb) => {
                    createHandHistoryTable().then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            message.push(`error: ${result.error}`);
                        }
                        cb();
                    });
                },
                (cb) => {
                    createGameHistoryPlayerPivotTable().then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            message.push(`error: ${result.error}`);
                        }
                        cb();
                    });
                },
                (cb) => {
                    createWinLossHistoryTable().then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            message.push(`error: ${result.error}`);
                        }
                        cb();
                    });
                }
            ];
            async.series(series, () => {
                resolve(message.join("\n").replace(/\n$/, ""));
            });
        });
    }
}
