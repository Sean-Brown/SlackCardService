import {IWinLossHistoryActions} from "../../abstraction/interfaces/iwin_loss_history_actions";
import {WinLossHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName, BaseTable} from "../../abstraction/tables/base_table";
import {WinLossHistory} from "../../abstraction/tables/win_loss_history";
import {Player} from "../../abstraction/tables/player";
var Q = require("q");

class WinLossHistoryActions implements IWinLossHistoryActions {
    private static get TABLE_NAME():string { return getTableName(DBTables.WinLossHistory); }
    private static get Player_TABLE():string { return getTableName(DBTables.Player); }
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
            INSERT INTO ${WinLossHistoryActions.TABLE_NAME}
            (${WinLossHistory.COL_PLAYER_ID}, ${WinLossHistory.COL_GAME_HISTORY_ID}, ${WinLossHistory.COL_WON})
            VALUES 
            (${wlh.player_id}, ${wlh.game_history_id}, ${wlh.won}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    createMany(wlhs:Array<WinLossHistory>):Q.Promise<WinLossHistoryReturn> {
        var query = [`
            INSERT INTO ${WinLossHistoryActions.TABLE_NAME}
            (${WinLossHistory.COL_PLAYER_ID}, ${WinLossHistory.COL_GAME_HISTORY_ID}, ${WinLossHistory.COL_WON})
            VALUES\n
        `];
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
            FROM ${WinLossHistoryActions.TABLE_NAME}
            WHERE ${WinLossHistory.COL_PLAYER_ID}=(
                SELECT ${Player.COL_ID}
                FROM ${WinLossHistoryActions.Player_TABLE}
                WHERE ${Player.COL_NAME}='${player}'
                );
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var win_loss_history_actions = new WinLossHistoryActions();