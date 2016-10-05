import {IGameHistoryActions} from "../../abstraction/interfaces/igame_history_actions";
import {GameHistoryReturn} from "../../abstraction/return/db_return";
import {PostgresTables} from "../../../db/implementation/postgres/create_tables";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "./manager";
var Q = require("q");
import utcTimestamp = PostgresTables.utcTimestamp;

class GameHistoryActions implements IGameHistoryActions {
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
            INSERT INTO ${getTableName(DBTables.GameHistory)} (game_id) 
            VALUES (${game_id}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    findMostRecent(game_id:number):Q.Promise<GameHistoryReturn> {
        var query = `
            SELECT * FROM ${getTableName(DBTables.GameHistory)} 
            WHERE game_id=${game_id} AND ended IS NULL
            ORDER BY id DESC 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
    endGame(game_history_id:number):Q.Promise<GameHistoryReturn> {
        var query = `
            UPDATE ${getTableName(DBTables.GameHistory)}
            SET ended=${utcTimestamp()}
            WHERE id=${game_history_id}
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var game_history_actions = new GameHistoryActions();