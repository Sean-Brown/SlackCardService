import {IWinLossHistoryActions} from "../../abstraction/interfaces/iwin_loss_history_actions";
import {WinLossHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
var Q = require("q");

class WinLossHistoryActions implements IWinLossHistoryActions {
    private runQueryReturning(query:string):Q.Promise<WinLossHistoryReturn> {
        return Q.Promise((resolve) => {
            var ret = new WinLossHistoryReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    create(player_id:number, game_history_id:number, won:boolean):Q.Promise<WinLossHistoryReturn> {
        var query = `
            INSERT INTO ${getTableName(DBTables.WinLossHistory)} (player_id, game_history_id, won) 
            VALUES (${player_id}, ${game_history_id}, ${won}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    get(player_id:number):Q.Promise<WinLossHistoryReturn> {
        var query = `
            SELECT * 
            FROM ${getTableName(DBTables.WinLossHistory)}
            WHERE player_id=${player_id};
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var win_loss_history_actions = new WinLossHistoryActions();