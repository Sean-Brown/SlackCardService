import {IHandHistoryActions} from "../../abstraction/interfaces/ihand_history_actions";
import {HandHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
var Q = require("q");

class HandHistoryActions implements IHandHistoryActions {
    private runQueryReturning(query:string):Q.Promise<HandHistoryReturn> {
        return new Q.Promise((resolve) => {
            var ret = new HandHistoryReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    create(player_id:number, game_history_id:number, hand:string, cut:string):Q.Promise<HandHistoryReturn> {
        var query = `
            INSERT INTO ${getTableName(DBTables.HandHistory)} (player_id, game_history_id, hand, cut) 
            VALUES (${player_id}, ${game_history_id}, '${hand}', '${cut}') 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var hand_history_actions = new HandHistoryActions();