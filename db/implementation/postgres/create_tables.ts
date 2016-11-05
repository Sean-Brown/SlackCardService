/// <reference path="../../../typings/index.d.ts" />

import {DBTables, getTableName, BaseTable} from "../../abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "./manager";
import async   = require("async");
import {Game} from "../../abstraction/tables/game";
import {Team} from "../../abstraction/tables/team";
import {GameHistory} from "../../abstraction/tables/game_history";
import {GameHistoryPlayerPivot} from "../../abstraction/tables/game_history_player";
import {HandHistory} from "../../abstraction/tables/hand_history";
import {CribbageHandHistory} from "../../abstraction/tables/cribbage_hand_history";
import {Player} from "../../abstraction/tables/player";
import {WinLossHistory} from "../../abstraction/tables/win_loss_history";
import {getErrorMessage} from "../../../routes/lib";
var Q = require("q");

export module PostgresTables {
    function createTable(table:DBTables):string {
        return `CREATE TABLE IF NOT EXISTS ${getTableName(table)}`;
    }
    function primaryKey():string {
        return `${BaseTable.COL_ID} SERIAL PRIMARY KEY`;
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
            const name = Game.COL_NAME;
            var query = `
                ${createTable(DBTables.Game)}
                (
                    ${primaryKey()},
                    ${name} varchar(128) ${notNullUniqueLengthCheck(name)}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createTeamTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            const name = Team.COL_NAME;
            var query = `
                ${createTable(DBTables.Team)}
                (
                    ${primaryKey()},
                    ${name} varchar(128) ${notNullUniqueLengthCheck(name)}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function initDefaultTeams(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            var query = `
                INSERT INTO ${getTableName(DBTables.Team)} (${Team.COL_NAME})
                VALUES ('red'), ('green'), ('blue')
                ON CONFLICT DO NOTHING;
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
                    ${GameHistory.COL_GAME_ID} integer REFERENCES ${getTableName(DBTables.Game)},
                    ${GameHistory.COL_BEGAN} timestamp ${defaultTimestamp()},
                    ${GameHistory.COL_ENDED} timestamp
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
                    ${GameHistoryPlayerPivot.COL_GAME_HISTORY_ID} integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    ${GameHistoryPlayerPivot.COL_PLAYER_ID} integer REFERENCES ${getTableName(DBTables.Player)}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createHandHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            const hand = HandHistory.COL_HAND;
            var query = `
                ${createTable(DBTables.HandHistory)} 
                (
                    ${primaryKey()},
                    ${HandHistory.COL_GAME_HISTORY_ID} integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    ${HandHistory.COL_PLAYER_ID} integer REFERENCES ${getTableName(DBTables.Player)},
                    ${hand} varchar(128) ${notNullLengthCheck(hand)},
                    ${HandHistory.COL_RECEIVED} timestamp ${defaultTimestamp()}
                );
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createCribbageHandHistoryTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            // NOTE add the foreign key constraints since constraints are NOT inherited, only columns
            const cut = CribbageHandHistory.COL_CUT;
            var query = `  
                ${createTable(DBTables.CribbageHandHistory)}
                (
                    ${CribbageHandHistory.COL_GAME_HISTORY_ID} integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    ${CribbageHandHistory.COL_PLAYER_ID} integer REFERENCES ${getTableName(DBTables.Player)},
                    ${cut} varchar(4) ${notNullLengthCheck(cut)},
                    ${CribbageHandHistory.COL_IS_CRIB} boolean NOT NULL DEFAULT false,
                    ${CribbageHandHistory.COL_PLAYED} boolean DEFAULT false,
                    ${CribbageHandHistory.COL_POINTS} integer DEFAULT 0
                ) INHERITS(${getTableName(DBTables.HandHistory)});
            `.trim();
            runPostgresQuery(query, resolve);
        });
    }
    function createPlayerTable(): Q.Promise<PGQueryReturn> {
        return new Q.Promise((resolve) => {
            const name = Player.COL_NAME;
            var query = `
                ${createTable(DBTables.Player)} 
                (
                    ${primaryKey()},
                    ${name} varchar ${notNullUniqueLengthCheck(name)},
                    ${Player.COL_JOINED} timestamp ${defaultTimestamp()}
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
                    ${WinLossHistory.COL_GAME_HISTORY_ID} integer REFERENCES ${getTableName(DBTables.GameHistory)},
                    ${WinLossHistory.COL_PLAYER_ID} integer REFERENCES ${getTableName(DBTables.Player)},
                    ${WinLossHistory.COL_WON} boolean DEFAULT FALSE
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
                    runMethod(createTeamTable, cb, message);
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
                },
                (cb) => {
                    runMethod(initDefaultTeams, cb, message);
                }
            ];
            async.series(series, () => {
                // Join all the error messages together into one message to resolve on
                resolve(getErrorMessage(message));
            });
        });
    }
}
