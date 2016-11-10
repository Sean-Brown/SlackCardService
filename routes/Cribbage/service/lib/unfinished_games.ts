import {pg_mgr, PGQueryReturn} from "../../../../db/implementation/postgres/manager";
import {DBTables, getTableName, BaseTable} from "../../../../db/abstraction/tables/base_table";
import {WinLossHistory} from "../../../../db/abstraction/tables/win_loss_history";
import {GameHistoryPlayerPivot} from "../../../../db/abstraction/tables/game_history_player";
import {GameHistory} from "../../../../db/abstraction/tables/game_history";
var Q = require("q");

export class UnfinishedGames {
    /**
     * The a set of the unfinished game-history IDs
     */
    private unfinishedGames:Set<number>;

    constructor() {
        this.unfinishedGames = new Set();
    }

    /**
     * Find out if the given game is unfinished
     * @param gameHistoryID
     * @returns {boolean}
     */
    public isUnfinished(gameHistoryID:number):Q.Promise<boolean> {
        return new Q.Promise((resolve) => {
            let isUnfinished = this.unfinishedGames.has(gameHistoryID);
            if (!isUnfinished) {
                // Check in the database
                let query = `
                    SELECT ${GameHistory.COL_ID}
                    FROM ${getTableName(DBTables.GameHistory)}
                    WHERE ${GameHistory.COL_ID} IN (
                        SELECT DISTINCT ${WinLossHistory.COL_GAME_HISTORY_ID}
                        FROM ${getTableName(DBTables.WinLossHistory)}
                        WHERE ${WinLossHistory.COL_GAME_HISTORY_ID}=${gameHistoryID}
                    );
                `.trim();
                pg_mgr.runQuery(query)
                    .then((result:PGQueryReturn) => {
                        if (result.error.length > 0) {
                            resolve(false);
                        }
                        else {
                            resolve(result.value.rowCount > 0);
                        }
                    });
            }
            else {
                resolve(isUnfinished);
            }
        });
    }

    /**
     * Add the game to the set of unfinished games
     * @param gameHistoryID
     */
    public addUnfinishedGame(gameHistoryID:number):void {
        if (!this.unfinishedGames.has(gameHistoryID)) {
            this.unfinishedGames.add(gameHistoryID);
        }
    }

    /**
     * Get the number of unfinished games
     * @returns {number}
     */
    public countUnfinishedGames() {
        return this.unfinishedGames.size;
    }

    /**
     * Run a query returning the IDs of the all the unfinished game-history rows
     * @returns {Q.Promise<Array<number>>}
     */
    public getUnfinishedGames():Q.Promise<Array<number>> {
        var that = this;
        return new Q.Promise((resolve) => {
            let gameHistoryIDs = [];
            var query = `
                SELECT ${GameHistory.COL_ID}
                FROM ${getTableName(DBTables.GameHistory)}
                WHERE ${GameHistory.COL_ID} NOT IN (
                    SELECT DISTINCT ${WinLossHistory.COL_GAME_HISTORY_ID}
                    FROM ${getTableName(DBTables.WinLossHistory)}
                );
            `.trim();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    if (result.error.length == 0) {
                        let gameHistories = result.value.rows;
                        gameHistories.forEach((gh:GameHistory) => {
                            gameHistoryIDs.push(gh.id);
                            that.addUnfinishedGame(gh.id);
                        });
                    }
                    else {
                        console.log(result.error);
                    }
                    resolve(gameHistoryIDs);
                });
        });
    }

    public playerUnfinishedGames(playerID:number):Q.Promise<Array<number>> {
        let that = this;
        return new Q.Promise((resolve) => {
            let gameHistoryIDs = [];
            var query = `
                SELECT ${GameHistoryPlayerPivot.COL_GAME_HISTORY_ID}
                FROM ${getTableName(DBTables.GameHistoryPlayer)}
                WHERE ${GameHistoryPlayerPivot.COL_PLAYER_ID}=${playerID} AND ${GameHistoryPlayerPivot.COL_GAME_HISTORY_ID} NOT IN (
                    SELECT DISTINCT ${WinLossHistory.COL_GAME_HISTORY_ID}
                    FROM ${getTableName(DBTables.WinLossHistory)}
                );
            `.trim();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    if (result.error.length == 0) {
                        result.value.rows.forEach((gameHistoryPlayer:GameHistoryPlayerPivot) => {
                            let ghid = gameHistoryPlayer.game_history_id;
                            gameHistoryIDs.push(ghid);
                            that.addUnfinishedGame(ghid);
                        });
                    }
                    else {
                        console.log(result.error);
                    }
                    resolve(gameHistoryIDs);
                });
        });
    }
}