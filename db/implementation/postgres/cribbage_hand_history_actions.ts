import {ICribbageHandHistoryActions} from "../../abstraction/interfaces/icribbage_hand_history_actions";
import {CribbageHandHistoryReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
var Q = require("q");

class CribbageHandHistoryActions implements ICribbageHandHistoryActions {
    private runQueryReturning(query:string):Q.Promise<CribbageHandHistoryReturn> {
        return new Q.Promise((resolve, reject) => {
            var ret = new CribbageHandHistoryReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                })
                .catch((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    reject(ret);
                });
        });
    }
    create(player_id:number, game_history_id:number, hand:string, cut:string):Q.Promise<CribbageHandHistoryReturn> {
        var query = `
            INSERT INTO ${getTableName(DBTables.CribbageHandHistory)} (player_id, game_history_id, hand, cut) 
            VALUES (${player_id}, ${game_history_id}, '${hand}', '${cut}') 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var cribbage_hand_history_actions = new CribbageHandHistoryActions();