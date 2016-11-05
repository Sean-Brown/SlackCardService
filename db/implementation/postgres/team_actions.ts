/// <reference path="../../../typings/index.d.ts" />

import {getTableName, DBTables, BaseTable} from "../../abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "./manager";
import {ITeamActions} from "../../abstraction/interfaces/iteam_actions";
import {TeamReturn} from "../../abstraction/return/db_return";
import {Team} from "../../abstraction/tables/team";
var Q = require("q");

class TeamActions implements ITeamActions {
    private static get TABLE_NAME():string { return getTableName(DBTables.Team); }
    private runQueryReturning(query:string):Q.Promise<TeamReturn> {
        return new Q.Promise((resolve) => {
            var ret = new TeamReturn();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    ret.initFromResult(result);
                    resolve(ret);
                });
        });
    }
    public create(name:string):Q.Promise<TeamReturn> {
        var query = `
            INSERT INTO ${TeamActions.TABLE_NAME} 
            (${Team.COL_NAME}) 
            VALUES 
            ('${name}') 
            RETURNING *;
        `.trim();
        return this.runQueryReturning(query);
    }
    public findByName(name:string):Q.Promise<TeamReturn> {
        var query = `
            SELECT * FROM ${TeamActions.TABLE_NAME} 
            WHERE ${Team.COL_NAME}='${name}' 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
    public find(id:number):Q.Promise<TeamReturn> {
        var query = `
            SELECT * FROM ${TeamActions.TABLE_NAME} 
            WHERE ${Team.COL_ID}=${id} 
            LIMIT 1;
        `.trim();
        return this.runQueryReturning(query);
    }
}
export var team_actions = new TeamActions();