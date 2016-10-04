import {IPlayerActions} from "../../abstraction/interfaces/iplayer_actions";
import {PlayerReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {Player} from "../../abstraction/tables/player";
import {pg_mgr, PGQueryReturn} from "./manager";
import {QueryResult} from "pg";
import {DBTables, getTableName} from "../../abstraction/tables/base_table";
var Q = require("q");

class PlayerActions implements IPlayerActions {
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
            INSERT INTO ${getTableName(DBTables.Player)} (name) 
            VALUES ('${name}') 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }

    findByName(name:string):Q.Promise<PlayerReturn> {
        var query = `
            SELECT * 
            FROM ${getTableName(DBTables.Player)} 
            WHERE name='${name}' 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }

    find(id:number):Q.Promise<PlayerReturn> {
        var query = `
            SELECT * 
            FROM ${getTableName(DBTables.Player)} 
            WHERE id=${id} 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var player_actions = new PlayerActions();