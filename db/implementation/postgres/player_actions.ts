import {IPlayerActions} from "../../abstraction/interfaces/iplayer_actions";
import {PlayerReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {Player} from "../../abstraction/tables/player";
import {pg_mgr} from "./manager";
import {QueryResult} from "pg";
import Promise = require("Promise");
import {DBTables, getTableName} from "../../abstraction/tables/base_table";

export module PostgresImpl {
    export class PlayerActions implements IPlayerActions {
        runQueryReturning(query:string):Promise<PlayerReturn> {
            return new Promise<PlayerReturn>(function(resolve, reject) {
                pg_mgr.query(query, null, (err: Error, result: QueryResult) => {
                    var ret = new PlayerReturn();
                    if (err != null) {
                        ret.status = DBReturnStatus.error;
                        ret.message = err.message;
                    }
                    else if (result.rowCount > 0) {
                        ret.result.push(new Player(result.rows[0][0], result.rows[0][1]))
                    }
                    resolve(ret);
                });
            });
        }
        processResult(result: PlayerReturn) {
            if (result.status != DBReturnStatus.ok) {
                throw result.message;
            }
            else if (result.result.length == 0) {
                throw "did not get back any rows";
            }
        }

        create(name:string):PlayerReturn {
            var ret = new PlayerReturn();
            var query = `
                INSERT INTO ${getTableName(DBTables.Player)} (username) VALUES
                (${name}) RETURNING *;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: PlayerReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }

        findByName(name:string):PlayerReturn {
            var ret = new PlayerReturn();
            var query = `
                SELECT * FROM ${getTableName(DBTables.Player)} WHERE username='${name}' LIMIT 1;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: PlayerReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }

        find(id:number):PlayerReturn {
            var ret = new PlayerReturn();
            var query = `
                SELECT * FROM ${getTableName(DBTables.Player)} WHERE id=${id} LIMIT 1;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: PlayerReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
    }
}