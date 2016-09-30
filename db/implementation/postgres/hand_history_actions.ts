import {IHandHistoryActions} from "../../abstraction/interfaces/ihand_history_actions";
import {HandHistoryReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {HandHistory} from "../../abstraction/tables/hand_history";
import {QueryResult} from "pg";
import {pg_mgr} from "./manager";
import Promise = require("Promise");
import {DBTables, getTableName} from "../../abstraction/tables/base_table";

export module PostgresImpl {
    export class HandHistoryActions implements IHandHistoryActions {
        runQueryReturning(query:string):Promise<HandHistoryReturn> {
            return new Promise<HandHistoryReturn>(function(resolve, reject) {
                pg_mgr.query(query, null, (err: Error, result: QueryResult) => {
                    var ret = new HandHistoryReturn();
                    if (err != null) {
                        ret.status = DBReturnStatus.error;
                        ret.message = err.message;
                    }
                    else if (result.rowCount > 0) {
                        ret.result.push(new HandHistory(
                            result.rows[0][0],
                            result.rows[0][1],
                            result.rows[0][2]
                        ))
                    }
                    resolve(ret);
                });
            });
        }
        processResult(result: HandHistoryReturn) {
            if (result.status != DBReturnStatus.ok) {
                throw result.message;
            }
            else if (result.result.length == 0) {
                throw "did not get back any rows";
            }
        }
        create(player_id:number, game_history_id:number, hand:string):HandHistoryReturn {
            var ret = new HandHistoryReturn();
            var query = `
                INSERT INTO ${getTableName(DBTables.HandHistory)} (player_id, game_history_id, hand) VALUES
                (${player_id}, ${game_history_id}, ${hand}) RETURNING *;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: HandHistoryReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
    }
}