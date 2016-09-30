import {GameHistoryPlayerReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {IGameHistoryPlayerPivotActions} from "../../abstraction/interfaces/igame_history_player_actions";
import {GameHistoryPlayerPivot} from "../../abstraction/tables/game_history_player";
import {QueryResult} from "pg";
import {pg_mgr} from "./manager";
import Promise = require("Promise");
import {DBTables, getTableName} from "../../abstraction/tables/base_table";

export module PostgresImpl {
    export class GameHistoryPlayerPivotActions implements IGameHistoryPlayerPivotActions {
        runQueryReturning(query:string):Promise<GameHistoryPlayerReturn> {
            return new Promise<GameHistoryPlayerReturn>(function(resolve, reject) {
                pg_mgr.query(query, null, (err: Error, result: QueryResult) => {
                    var ret = new GameHistoryPlayerReturn();
                    if (err != null) {
                        ret.status = DBReturnStatus.error;
                        ret.message = err.message;
                    }
                    else if (result.rowCount > 0) {
                        ret.result.push(new GameHistoryPlayerPivot(
                            result.rows[0][0],
                            result.rows[0][1],
                            result.rows[0][2]
                        ))
                    }
                    resolve(ret);
                });
            });
        }
        processResult(result: GameHistoryPlayerReturn) {
            if (result.status != DBReturnStatus.ok) {
                throw result.message;
            }
            else if (result.result.length == 0) {
                throw "did not get back any rows";
            }
        }
        createAssociation(player_id:number, game_history_id:number): GameHistoryPlayerReturn {
            var ret = new GameHistoryPlayerReturn();
            var query = `
                INSERT INTO ${getTableName(DBTables.GameHistoryPlayer)} (player_id, game_history_id) VALUES 
                (${player_id}, ${game_history_id}) RETURNING *;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: GameHistoryPlayerReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
    }
}