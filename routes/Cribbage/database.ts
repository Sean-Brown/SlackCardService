/*
 *********************************************************************************************************************
 TODO: move to its own folder if we ever add another game, for now since it's just cribbage we can keep the file here
 *********************************************************************************************************************
 */

import {GameHistory} from "../../db/abstraction/tables/game_history";
import {CribbageHandHistory} from "../../db/abstraction/tables/cribbage_hand_history";
import {pg_mgr} from "../../db/implementation/postgres/manager";
import {win_loss_history_actions} from "../../db/implementation/postgres/win_loss_history_actions";
import {WinLossHistoryReturn, DBReturnStatus, GameReturn} from "../../db/abstraction/return/db_return";
import {Game} from "../../db/abstraction/tables/game";
import {game_actions} from "../../db/implementation/postgres/game_actions";
var Q = require("q");

export module DBRoutes {

    export enum Routes {
        winLossHistory = <any>"/wlHistory",
        gameHistory = <any>"/gameHistory",
        handHistory = <any>"/handHistory"
    }

    export class WinLossHistoryResponse {
        wins:number;
        losses:number;
    }

    export class GameHistoryItem {
        game:GameHistory;
        won:boolean;
    }
    export class GameHistoryResponse {
        games:Array<GameHistoryItem>;
    }

    export class CribbageHandHistoryResponse {
        hands:Array<CribbageHandHistory>;
    }

    class Router {
        constructor(private initialized = false) { }
        private init():Q.Promise<void> {
            var that = this;
            return new Q.Promise((resolve) => {
                if (that.initialized) {
                    // Already initialize, resolve immediately
                    resolve();
                }
                else {
                    // Initialize the Postgres database then resolve
                    pg_mgr.init()
                        .then(() => {
                            that.initialized = true;
                            resolve();
                        });
                }
            });
        }

        /**
         * Get the Game object for the given game, or create the game row if that game does not exist
         * @param game the name of the game
         * @returns {Q.Promise<Game>} a promise to return a Game object representing a row in the <game> database table
         */
        getGame(game:string):Q.Promise<Game> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init()
                    .then(() => {
                        return game_actions.findByName(game);
                    })
                    .then((result:GameReturn) => {
                        if (result.status != DBReturnStatus.ok) {
                            console.log(`Error finding ${game}: ${result.message}`);
                            reject(null);
                        }
                        else {
                            if (result.result.length == 0) {
                                // The game doesn't exist, create it
                                game_actions.create(game)
                                    .then((result:GameReturn) => {
                                        if (result.status != DBReturnStatus.ok) {
                                            console.log(`Error creating ${game}: ${result.message}`);
                                            reject(null);
                                        }
                                        else if (result.result.length == 0) {
                                            console.log(`Unknown error creating ${game}`);
                                            reject(null);
                                        }
                                        else {
                                            resolve(result.first());
                                        }
                                    })
                            }
                            else {
                                resolve(result.result);
                            }
                        }
                    });
            });
        }
        winLossHistory(player:string):Q.Promise<WinLossHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init()
                    .then(() => {
                        return win_loss_history_actions.get(player);
                    })
                    .then((result:WinLossHistoryReturn) => {
                        var ret = new WinLossHistoryResponse();
                        if (result.status != DBReturnStatus.ok) {
                            for (let ix = 0; ix < result.result.length; ix++) {
                                if (result.result[ix].won) {
                                    ret.wins++;
                                }
                                else {
                                    ret.losses++;
                                }
                            }
                            resolve(ret);
                        }
                        else {
                            reject(ret);
                        }
                    });
            });
        }
        gameHistory(player:string):Q.Promise<GameHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init().then(() => {
                    var ret = new GameHistoryResponse();
                    resolve(ret);
                });
            });
        }
        cribbageHandHistory(player:string, gameHistoryID:number):Q.Promise<CribbageHandHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init().then(() => {
                    var ret = new CribbageHandHistoryResponse();
                    resolve(ret);
                });
            });
        }
    }
    export var router = new Router();

}