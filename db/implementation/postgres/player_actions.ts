import {IPlayerActions} from "../../abstraction/interfaces/iplayer_actions";
import {PlayerReturn} from "../../abstraction/return/db_return";
import {pg_mgr, PGQueryReturn} from "./manager";
import {DBTables, getTableName, BaseTable} from "../../abstraction/tables/base_table";
import {Player} from "../../abstraction/tables/player";
var Q = require("q");

class PlayerActions implements IPlayerActions {
    private static get TABLE_NAME():string { return getTableName(DBTables.Player); }
    private runQueryReturning(query:string):Q.Promise<PlayerReturn> {
        return new Q.Promise((resolve) => {
            var ret = new PlayerReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    create(name:string):Q.Promise<PlayerReturn> {
        var query = `
            INSERT INTO ${PlayerActions.TABLE_NAME} 
            (${Player.COL_NAME}) 
            VALUES 
            ('${name}') 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }

    findByName(name:string):Q.Promise<PlayerReturn> {
        var query = `
            SELECT * 
            FROM ${PlayerActions.TABLE_NAME} 
            WHERE ${Player.COL_NAME}='${name}' 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }

    find(id:number):Q.Promise<PlayerReturn> {
        var query = `
            SELECT * 
            FROM ${PlayerActions.TABLE_NAME} 
            WHERE ${Player.COL_ID}=${id} 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var player_actions = new PlayerActions();