/*
 *********************************************************************************************************************
 TODO: move to its own folder if we ever add another game, for now since it's just cribbage we can keep the file here
 *********************************************************************************************************************
 */

import {GameHistory} from "../../db/abstraction/tables/game_history";
import {HandHistory} from "../../db/abstraction/tables/hand_history";
import {pg_mgr} from "../../db/implementation/postgres/manager";
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

    export class HandHistoryResponse {
        hands:Array<HandHistory>;
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
                    pg_mgr.init().then(() => {
                        that.initialized = true;
                        resolve();
                    })
                }
            });
        }

        winLossHistory(player:string):Q.Promise<WinLossHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init().then(() => {
                    var ret = new WinLossHistoryResponse();
                    resolve(ret);
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
        handHistory(player:string, gameHistoryID:number):Q.Promise<HandHistoryResponse> {
            var that = this;
            return new Q.Promise((resolve, reject) => {
                that.init().then(() => {
                    var ret = new HandHistoryResponse();
                    resolve(ret);
                });
            });
        }
    }
    export var router = new Router();

}