import {GameHistoryPlayerReturn} from "../../abstraction/return/db_return";
import {IGameHistoryPlayerPivotActions} from "../../abstraction/interfaces/igame_history_player_actions";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {GameHistoryPlayerPivot as GHPP} from "../../abstraction/tables/game_history_player";
var Q = require("q");

class GameHistoryPlayerPivotActions implements IGameHistoryPlayerPivotActions {
    private static get TABLE_NAME():string { return getTableName(DBTables.GameHistoryPlayer); }
    private runQueryReturning(query:string):Q.Promise<GameHistoryPlayerReturn> {
        return new Q.Promise((resolve) => {
            var ret = new GameHistoryPlayerReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    createAssociation(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerReturn> {
        var query = `
            INSERT INTO ${GameHistoryPlayerPivotActions.TABLE_NAME} 
            (${GHPP.COL_PLAYER_ID}, ${GHPP.COL_GAME_HISTORY_ID}) 
            VALUES 
            (${player_id}, ${game_history_id}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    createAssociations(player_ids:Array<number>, game_history_id:number): Q.Promise<GameHistoryPlayerReturn> {
        var query = [`
            INSERT INTO ${GameHistoryPlayerPivotActions.TABLE_NAME} 
            (${GHPP.COL_PLAYER_ID}, ${GHPP.COL_GAME_HISTORY_ID}) 
            VALUES\n
        `];
        for (let ix = 0; ix < player_ids.length; ix++) {
            query.push(`(${player_ids[ix]}, ${game_history_id})`);
            query.push(",\n");
        }
        // Remove the last comma
        query.pop();
        query.push("\nRETURNING *;");
        return this.runQueryReturning(query.join(''));
    }
    findAssociation(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerReturn> {
        var query = `
            SELECT * 
            FROM ${GameHistoryPlayerPivotActions.TABLE_NAME}
            WHERE ${GHPP.COL_PLAYER_ID}=${player_id} AND ${GHPP.COL_GAME_HISTORY_ID}=${game_history_id};
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var game_history_player_actions = new GameHistoryPlayerPivotActions();