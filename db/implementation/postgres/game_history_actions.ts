import {IGameHistoryActions} from "../../abstraction/interfaces/igame_history_actions";
import {GameHistoryReturn, GameReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {pg_mgr} from "./manager";
import {QueryResult} from "pg";
import {GameHistory} from "../../abstraction/tables/game_history";
import Promise = require("Promise");

export module PostgresImpl {
    export class GameHistoryActions implements IGameHistoryActions {
        runQueryReturning(query:string):Promise<GameHistoryReturn> {
            return new Promise<GameHistoryReturn>(function(resolve, reject) {
                pg_mgr.query(query, null, (err: Error, result: QueryResult) => {
                    var ret = new GameHistoryReturn();
                    if (err != null) {
                        ret.status = DBReturnStatus.error;
                        ret.message = err.message;
                    }
                    else if (result.rowCount > 0) {
                        ret.result.push(new GameHistory(result.rows[0][0], result.rows[0][1]))
                    }
                    resolve(ret);
                });
            });
        }
        processResult(result: GameHistoryReturn) {
            if (result.status != DBReturnStatus.ok) {
                throw result.message;
            }
            else if (result.result.length == 0) {
                throw "did not get back any rows";
            }
        }
        create(game_id:number):GameHistoryReturn {
            var ret = new GameHistoryReturn();
            var query = `
                INSERT INTO ${getTableName(DBTables.GameHistory)} (game_id) VALUES 
                (${game_id}) RETURNING *;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: GameHistoryReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
        findMostRecent(game_id:number):GameHistoryReturn {
            var ret = new GameHistoryReturn();
            var query = `
                SELECT * FROM ${getTableName(DBTables.GameHistory)} WHERE game_id=${game_id} LIMIT 1;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: GameHistoryReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
    }
}