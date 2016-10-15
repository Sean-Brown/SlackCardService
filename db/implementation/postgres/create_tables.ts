/// <reference path="../../../typings/index.d.ts" />

import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "./manager";
import async   = require("async");
var Q = require("q");

export module PostgresTables {
    function createTable(table:DBTables):string {
        return `CREATE TABLE IF NOT EXISTS ${getTableName(table)}`;
    }
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
    function runPostgresQuery(query:string, resolve:Function) {
        pg_mgr.runQuery(query)
            .then((result:PGQueryReturn) => { resolve(result); })
            .catch((result:PGQueryReturn) => { resolve(result); });
    }
    function createGameTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                ${createTable(DBTables.Game)}
                (
                    ${primaryKey()},
                    name varchar(128) ${notNullUniqueLengthCheck("name")}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createGameHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                ${createTable(DBTables.GameHistory)} 
                (
                    ${primaryKey()},
                    game_id integer REFERENCES ${getTableName(DBTables.Game)},
                    began timestamp ${defaultTimestamp()},
                    ended timestamp
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createGameHistoryPlayerPivotTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                ${createTable(DBTables.GameHistoryPlayer)} 
                (
                    ${primaryKey()},
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createHandHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                ${createTable(DBTables.HandHistory)} 
                (
                    ${primaryKey()},
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)},
                    hand varchar(128) ${notNullLengthCheck("hand")},
                    received timestamp ${defaultTimestamp()}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createCribbageHandHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            // NOTE add the foreign key constraints since constraints are NOT inherited, only columns
            var query = `  
                ${createTable(DBTables.CribbageHandHistory)}
                (
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)},
                    cut varchar(4) ${notNullLengthCheck("cut")}   
                ) INHERITS(${getTableName(DBTables.HandHistory)});
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createPlayerTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                ${createTable(DBTables.Player)} 
                (
                    ${primaryKey()},
                    name varchar ${notNullUniqueLengthCheck("name")},
                    joined timestamp ${defaultTimestamp()}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createWinLossHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                ${createTable(DBTables.WinLossHistory)} 
                (
                    ${primaryKey()},
                    game_history_id integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    player_id integer REFERENCES ${getTableName(DBTables.Player)},
                    won boolean DEFAULT FALSE
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }

    function runMethod(f:Function, cb:any, message:Array<string>) {
        f()
            .then((result:PGQueryReturn) => {
                if (result.error.length > 0) {
                    message.push(`error: ${result.error}`);
                }
            })
            .finally(() => {
                cb();
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
                    runMethod(createGameTable, cb, message);
                },
                (cb) => {
                    runMethod(createPlayerTable, cb, message);
                },
                (cb) => {
                    runMethod(createGameHistoryTable, cb, message);
                },
                (cb) => {
                    runMethod(createHandHistoryTable, cb, message);
                },
                (cb) => {
                    runMethod(createCribbageHandHistoryTable, cb, message);
                },
                (cb) => {
                    runMethod(createGameHistoryPlayerPivotTable, cb, message);
                },
                (cb) => {
                    runMethod(createWinLossHistoryTable, cb, message);
                }
            ];
            async.series(series, () => {
                // Join all the error messages together into one message to resolve on
                resolve(message.join("\n").replace(/\n$/, ""));
            });
        });
    }
}
