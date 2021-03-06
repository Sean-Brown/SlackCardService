/// <reference path="../../../typings/index.d.ts" />

import {IGameActions} from "../../abstraction/interfaces/igame_actions";
import {GameReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {getTableName, DBTables} from "../../abstraction/tables/base_table";
import {QueryResult} from "pg";
import {pg_mgr, PGQueryReturn} from "./manager";
import {Game} from "../../abstraction/tables/game";
var Q = require("q");

class GameActions implements IGameActions {
    private runQueryReturning(query:string):Q.Promise<GameReturn> {
        return new Q.Promise((resolve) => {
            var ret = new GameReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    public create(name:string):Q.Promise<GameReturn> {
        var query = `
            INSERT INTO ${getTableName(DBTables.Game)} (name) 
            VALUES ('${name}') 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    public findByName(name:string):Q.Promise<GameReturn> {
        var query = `
            SELECT * FROM ${getTableName(DBTables.Game)} 
            WHERE name='${name}' 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
    public find(id:number):Q.Promise<GameReturn> {
        var query = `
            SELECT * FROM ${getTableName(DBTables.Game)} 
            WHERE id=${id} 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var game_actions = new GameActions();