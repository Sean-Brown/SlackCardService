import {ICribbageHandHistoryActions} from "../../abstraction/interfaces/icribbage_hand_history_actions";
import {CribbageHandHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
import {CribbageHandHistory} from "../../abstraction/tables/cribbage_hand_history";
var Q = require("q");

class CribbageHandHistoryActions implements ICribbageHandHistoryActions {
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
    create(chh:CribbageHandHistory):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            INSERT INTO ${getTableName(DBTables.CribbageHandHistory)} (player_id, game_history_id, hand, cut, is_crib) 
            VALUES (${chh.player_id}, ${chh.game_history_id}, '${chh.hand}', '${chh.cut}', ${chh.is_crib}) 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    createMany(chhs:Array<CribbageHandHistory>):Q.Promise<CribbageHandHistoryReturn> {
        var query = [`INSERT INTO ${getTableName(DBTables.CribbageHandHistory)} (player_id, game_history_id, hand, cut, is_crib) VALUES\n`];
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
            DELETE FROM ${getTableName(DBTables.CribbageHandHistory)}
            WHERE game_history_id=${game_history_id}
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    all(player_id:number, game_history_id:number):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            SELECT *
            FROM ${getTableName(DBTables.CribbageHandHistory)}
            WHERE player_id=${player_id} AND game_history_id=${game_history_id};
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var cribbage_hand_history_actions = new CribbageHandHistoryActions();