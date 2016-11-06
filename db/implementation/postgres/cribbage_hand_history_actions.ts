import {ICribbageHandHistoryActions} from "../../abstraction/interfaces/icribbage_hand_history_actions";
import {CribbageHandHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {CribbageHandHistory as CHH, CribbageHandHistory} from "../../abstraction/tables/cribbage_hand_history";
var Q = require("q");

class CribbageHandHistoryActions implements ICribbageHandHistoryActions {
    private static get TABLE_NAME():string { return getTableName(DBTables.CribbageHandHistory); }
    private runQueryReturning(query:string):Q.Promise<CribbageHandHistoryReturn> {
        return new Q.Promise((resolve) => {
            var ret = new CribbageHandHistoryReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    create(chh:CHH):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            INSERT INTO ${CribbageHandHistoryActions.TABLE_NAME} 
            (${CHH.COL_PLAYER_ID}, ${CHH.COL_GAME_HISTORY_ID}, ${CHH.COL_HAND}, ${CHH.COL_CUT}, ${CHH.COL_IS_CRIB}) 
            VALUES (${chh.player_id}, ${chh.game_history_id}, '${chh.hand}', '${chh.cut}', ${chh.is_crib}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    createMany(chhs:Array<CHH>):Q.Promise<CribbageHandHistoryReturn> {
        var query = [`
            INSERT INTO ${CribbageHandHistoryActions.TABLE_NAME}
            (${CHH.COL_PLAYER_ID}, ${CHH.COL_GAME_HISTORY_ID}, ${CHH.COL_HAND}, ${CHH.COL_CUT}, ${CHH.COL_IS_CRIB})
            VALUES\n
        `];
        for (let ix = 0; ix < chhs.length; ix++) {
            var chh = chhs[ix];
            query.push(`(${chh.player_id}, ${chh.game_history_id}, '${chh.hand}', '${chh.cut}', ${chh.is_crib})`);
            query.push(",\n");
        }
        // Remove the last comma
        query.pop();
        query.push("\nRETURNING *;");
        return this.runQueryReturning(query.join(""));
    }
    remove(game_history_id:number):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            DELETE FROM ${CribbageHandHistoryActions.TABLE_NAME}
            WHERE ${CHH.COL_GAME_HISTORY_ID}=${game_history_id}
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    findPlayerHandsInGame(player_id:number, game_history_id:number):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
                SELECT *
                FROM ${CribbageHandHistoryActions.TABLE_NAME}
                WHERE ${CHH.COL_PLAYER_ID}=${player_id} AND ${CHH.COL_GAME_HISTORY_ID}=${game_history_id};
            `.trim();
        return this.runQueryReturning(query);
    }
    all(player_id:number, game_history_id:number):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            SELECT *
            FROM ${CribbageHandHistoryActions.TABLE_NAME}
            WHERE ${CHH.COL_PLAYER_ID}=${player_id} AND ${CHH.COL_GAME_HISTORY_ID}=${game_history_id};
        `.trim();
        return this.runQueryReturning(query);
    }
    setHandPlayed(player_id:number, game_history_id:number, points:number):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            UPDATE ${CribbageHandHistoryActions.TABLE_NAME}
            SET (${CHH.COL_PLAYED}, ${CHH.COL_POINTS})=(true, ${points})
            WHERE ${CHH.COL_PLAYER_ID}=${player_id} AND ${CHH.COL_GAME_HISTORY_ID}=${game_history_id};
        `.trim();
        return this.runQueryReturning(query);
    }
    getPoints(player_id:number, game_history_id:number): Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            SELECT ${CHH.COL_POINTS}
            FROM ${CribbageHandHistoryActions.TABLE_NAME}
            WHERE ${CHH.COL_PLAYER_ID}=${player_id} AND ${CHH.COL_GAME_HISTORY_ID}=${game_history_id} AND ${CHH.COL_PLAYED}=true
            ORDER BY ${CribbageHandHistory.COL_ID} DESC
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var cribbage_hand_history_actions = new CribbageHandHistoryActions();