import {IWinLossHistoryActions} from "../../abstraction/interfaces/iwin_loss_history_actions";
import {WinLossHistoryReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {WinLossHistory} from "../../abstraction/tables/win_loss_history";
import {QueryResult} from "pg";
import {pg_mgr} from "./manager";
import Promise = require("Promise");
import {DBTables, getTableName} from "../../abstraction/tables/base_table";

export module PostgresImpl {
    export class WinLossHistoryActions implements IWinLossHistoryActions {
        runQueryReturning(query:string):Promise<WinLossHistoryReturn> {
            return new Promise<WinLossHistoryReturn>(function(resolve, reject) {
                pg_mgr.query(query, null, (err: Error, result: QueryResult) => {
                    var ret = new WinLossHistoryReturn();
                    if (err != null) {
                        ret.status = DBReturnStatus.error;
                        ret.message = err.message;
                    }
                    else if (result.rowCount > 0) {
                        ret.result.push(new WinLossHistory(
                            result.rows[0][0],
                            result.rows[0][1],
                            result.rows[0][2],
                            result.rows[0][3]
                        ))
                    }
                    resolve(ret);
                });
            });
        }
        processResult(result: WinLossHistoryReturn) {
            if (result.status != DBReturnStatus.ok) {
                throw result.message;
            }
            else if (result.result.length == 0) {
                throw "did not get back any rows";
            }
        }

        create(player_id:number, game_history_id:number, won:boolean):WinLossHistoryReturn {
            var ret = new WinLossHistoryReturn();
            var query = `
                INSERT INTO ${getTableName(DBTables.WinLossHistory)} (player_id, game_history_id, won) VALUES
                (${player_id}, ${game_history_id}, ${won}) RETURNING *;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: WinLossHistoryReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
    }
}