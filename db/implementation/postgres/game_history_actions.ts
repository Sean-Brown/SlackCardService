import {IGameHistoryActions} from "../../abstraction/interfaces/igame_history_actions";
import {GameHistoryReturn} from "../../abstraction/return/db_return";
import {PostgresTables} from "../../../db/implementation/postgres/create_tables";
import {DBTables, getTableName, BaseTable} from "../../abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "./manager";
var Q = require("q");
import utcTimestamp = PostgresTables.utcTimestamp;
import {GameHistory} from "../../abstraction/tables/game_history";
import {GameHistoryPlayerPivot} from "../../abstraction/tables/game_history_player";
import {Player} from "../../abstraction/tables/player";

class GameHistoryActions implements IGameHistoryActions {
    private static get TABLE_NAME():string { return getTableName(DBTables.GameHistory); }
    private static get GameHistoryPlayer_TABLE():string { return getTableName(DBTables.GameHistoryPlayer); }
    private static get Player_TABLE():string { return getTableName(DBTables.Player); }
    private runQueryReturning(query:string):Q.Promise<GameHistoryReturn> {
        return Q.Promise((resolve) => {
            var ret = new GameHistoryReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    create(game_id:number):Q.Promise<GameHistoryReturn> {
        var query = `
            INSERT INTO ${GameHistoryActions.TABLE_NAME} (${GameHistory.COL_GAME_ID}) 
            VALUES (${game_id}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    findMostRecent(game_id:number):Q.Promise<GameHistoryReturn> {
        var query = `
            SELECT * 
            FROM ${GameHistoryActions.TABLE_NAME} 
            WHERE ${GameHistory.COL_GAME_ID}=${game_id} AND ${GameHistory.COL_ENDED} IS NULL
            ORDER BY ${GameHistory.COL_ID} DESC 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
    find(player:string, game_id:number):Q.Promise<GameHistoryReturn> {
        var query = `
            SELECT * 
            FROM ${GameHistoryActions.TABLE_NAME}
            WHERE ${GameHistory.COL_GAME_ID}=${game_id} AND ${GameHistory.COL_ID} IN (
                SELECT ${GameHistoryPlayerPivot.COL_GAME_HISTORY_ID}
                FROM ${GameHistoryActions.GameHistoryPlayer_TABLE}
                WHERE ${GameHistoryPlayerPivot.COL_PLAYER_ID}=(
                    SELECT ${Player.COL_ID}
                    FROM ${GameHistoryActions.Player_TABLE}
                    WHERE ${Player.COL_NAME}='${player}'
                )
            );
        `.trim();
        return this.runQueryReturning(query);
    }
    endGame(game_history_id:number):Q.Promise<GameHistoryReturn> {
        var query = `
            UPDATE ${GameHistoryActions.TABLE_NAME}
            SET ${GameHistory.COL_ENDED}=${utcTimestamp()}
            WHERE ${GameHistory.COL_ID}=${game_history_id}
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var game_history_actions = new GameHistoryActions();