/*
 *********************************************************************************************************************
 TODO: move to its own folder if we ever add another game, for now since it's just cribbage we can keep the file here
 *********************************************************************************************************************
 */

import {GameHistory} from "../../db/abstraction/tables/game_history";
import {CribbageHandHistory} from "../../db/abstraction/tables/cribbage_hand_history";
import {pg_mgr} from "../../db/implementation/postgres/manager";
import {win_loss_history_actions} from "../../db/implementation/postgres/win_loss_history_actions";
import {
    WinLossHistoryReturn, DBReturnStatus, GameReturn, PlayerReturn, GameHistoryReturn, GameHistoryPlayerReturn,
    CribbageHandHistoryReturn
} from "../../db/abstraction/return/db_return";
import {Game} from "../../db/abstraction/tables/game";
import {game_actions} from "../../db/implementation/postgres/game_actions";
import {Player} from "../../db/abstraction/tables/player";
import {player_actions} from "../../db/implementation/postgres/player_actions";
import {game_history_actions} from "../../db/implementation/postgres/game_history_actions";
import {game_history_player_actions} from "../../db/implementation/postgres/game_history_player_actions";
import {cribbage_hand_history_actions} from "../../db/implementation/postgres/cribbage_hand_history_actions";
import {getTableName, DBTables} from "../../db/abstraction/tables/base_table";
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
        private init():Q.Promise<string> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                if (that.initialized) {
                    // Already initialize, resolve immediately
                    resolve();
                }
                else {
                    // Initialize the Postgres database then resolve
                    pg_mgr.init()
                        .then(() => {
                            that.initialized = true;
                            resolve("");
                        })
                        .catch((err:string) => {
                            reject(err);
                        });
                }
            });
        }

        /**
         * Add a player to the database. If the player already exists, then return that player
         * from the database.
         * @param {string} player the name of the player
         * @returns {Q.Promise} resolves on a Player object or null if there was an error
         */
        addPlayer(player:string):Q.Promise<Player> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init()
                    .then(() => {
                        player_actions.findByName(player)
                            .then((result:PlayerReturn) => {
                                if (result.status != DBReturnStatus.ok) {
                                    console.log(result.message);
                                    reject(null);
                                }
                                else if (result.first() != null) {
                                    console.log(`Player ${player} already exists in the database`);
                                    resolve(result.first());
                                }
                                else {
                                    // The player does not exist, create them
                                    player_actions.create(player)
                                        .then((result:PlayerReturn) => {
                                            if (result.status != DBReturnStatus.ok) {
                                                console.log(result.message);
                                                reject(null);
                                            }
                                            else {
                                                console.log(`Created player ${player} in the database`);
                                                resolve(result.first());
                                            }
                                        });
                                }
                            });
                    })
                    .catch((err:string) => {
                        console.log(err);
                        reject(null);
                    });
            });
        }

        /**
         * Create a game history entry for the given game and players
         * @param game_history_id the ID of the game (i.e. the Cribbage ID in the database)
         * @param player_ids the IDs of the players who are part of this game
         */
        createGameHistory(game_history_id:number, player_ids:Array<number>): Q.Promise<GameHistory> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                var gameHistory:GameHistory = null;
                that.init()
                    .then(() => {
                        return game_history_actions.create(game_history_id)
                    })
                    .then((result:GameHistoryReturn) => {
                        if (result.status != DBReturnStatus.ok) {
                            console.error(result.message);
                            reject(null);
                        }
                        else {
                            // Save the game history object
                            gameHistory = result.first();
                            // Associate the players with the game
                            return game_history_player_actions.createAssociations(player_ids, game_history_id);
                        }
                    })
                    .then((result:GameHistoryPlayerReturn) => {
                        if (result.status != DBReturnStatus.ok) {
                            // Something went wrong
                            console.log(result.message);
                            reject(null);
                        }
                        else {
                            // Success! Resolve on the GameHistory object that was created
                            console.log(`Added ${player_ids} to the game history`);
                            resolve(gameHistory)
                        }
                    })
                    .catch((err:string) => {
                        console.log(err);
                        reject(null);
                    });
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
                                resolve(result.first());
                            }
                        }
                    })
                    .catch((err:string) => {
                        console.log(err);
                        reject(null);
                    });
            });
        }

        /**
         * Reset the game, this entails removing the Cribbage-hand-history entries.
         * There's no reason to remove the GameHistory or GameHistoryPlayer records,
         * those can be re-used.
         * @note this method always resolves: check the boolean result to check for success.
         * @param game_history_id
         * @returns {Q.Promise} whether or not resetting the Cribbage-hand-history succeeds
         */
        resetGame(game_history_id:number):Q.Promise<boolean> {
            var that = this;
            return new Q.Promise((resolve) => {
                that.init()
                    .then(() => {
                        cribbage_hand_history_actions.remove(game_history_id)
                            .then((result:CribbageHandHistoryReturn) => {
                                if (result.status != DBReturnStatus.ok) {
                                    // Something went wrong
                                    console.log(result.message);
                                    resolve(false);
                                }
                                else {
                                    console.log(`The GameHistory ${game_history_id} was reset`);
                                    resolve(true);
                                }
                            });
                    })
                    .catch((err:string) => {
                        console.log(err);
                        resolve(false);
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
                    })
                    .catch((err:string) => {
                        console.log(err);
                        reject(null);
                    });
            });
        }

        gameHistory(player:string):Q.Promise<GameHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init()
                    .then(() => {
                        var ret = new GameHistoryResponse();
                        resolve(ret);
                    })
                    .catch((err:string) => {
                        console.log(err);
                        reject(null);
                    });
            });
        }

        cribbageHandHistory(player:string, gameHistoryID:number):Q.Promise<CribbageHandHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init()
                    .then(() => {
                        var ret = new CribbageHandHistoryResponse();
                        resolve(ret);
                    })
                    .catch((err:string) => {
                        console.log(err);
                        reject(null);
                    });
            });
        }
    }
    export var router = new Router();

}