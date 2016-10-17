import {IWinLossHistoryActions} from "../../abstraction/interfaces/iwin_loss_history_actions";
import {WinLossHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {WinLossHistory} from "../../abstraction/tables/win_loss_history";
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
    create(wlh:WinLossHistory):Q.Promise<WinLossHistoryReturn> {
        var query = `
            INSERT INTO ${getTableName(DBTables.WinLossHistory)} (player_id, game_history_id, won) 
            VALUES (${wlh.player_id}, ${wlh.game_history_id}, ${wlh.won}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    createMany(wlhs:Array<WinLossHistory>):Q.Promise<WinLossHistoryReturn> {
        var query = [`INSERT INTO ${getTableName(DBTables.WinLossHistory)} (player_id, game_history_id, won) VALUES\n`];
        for (let ix = 0; ix < wlhs.length; ix++) {
            let wlh = wlhs[ix];
            query.push(`(${wlh.player_id}, ${wlh.game_history_id}, ${wlh.won})`);
            query.push(",\n");
        }
        // Remove the last comma
        query.pop();
        query.push("\nRETURNING *;");
        return this.runQueryReturning(query.join(""));
    }
    get(player:string):Q.Promise<WinLossHistoryReturn> {
        var query = `
            SELECT * 
            FROM ${getTableName(DBTables.WinLossHistory)}
            WHERE player_id=(
                SELECT id
                FROM ${getTableName(DBTables.Player)}
                WHERE name='${player}'
                );
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var win_loss_history_actions = new WinLossHistoryActions();