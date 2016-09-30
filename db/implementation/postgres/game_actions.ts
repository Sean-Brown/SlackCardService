import {IGameActions} from "../../abstraction/interfaces/igame_actions";
import {GameReturn, DBReturnStatus} from "../../abstraction/return/db_return";
import {getTableName, DBTables} from "../../abstraction/tables/base_table";
import Promise = require("Promise");
import {QueryResult} from "pg";
import {pg_mgr} from "./manager";
import {Game} from "../../abstraction/tables/game";

export module PostgresImpl {
    export class GameActions implements IGameActions {
        runQueryReturning(query:string):Promise<GameReturn> {
            return new Promise<GameReturn>(function(resolve, reject) {
                pg_mgr.query(query, null, (err: Error, result: QueryResult) => {
                    var ret = new GameReturn();
                    if (err != null) {
                        ret.status = DBReturnStatus.error;
                        ret.message = err.message;
                    }
                    else if (result.rowCount > 0) {
                        ret.result.push(new Game(result.rows[0][0], result.rows[0][1]))
                    }
                    resolve(ret);
                });
            });
        }
        processResult(result: GameReturn) {
            if (result.status != DBReturnStatus.ok) {
                throw result.message;
            }
            else if (result.result.length == 0) {
                throw "did not get back any rows";
            }
        }
        create(name:string):GameReturn {
            var ret = new GameReturn();
            var query = `
                INSERT INTO ${getTableName(DBTables.Game)} (name) VALUES 
                (${name}) RETURNING *;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: GameReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
        findByName(name:string):GameReturn {
            var ret = new GameReturn();
            var query = `
                SELECT * FROM ${getTableName(DBTables.Game)} WHERE name='${name}' LIMIT 1;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: GameReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
        find(id:number):GameReturn {
            var ret = new GameReturn();
            var query = `
                SELECT * FROM ${getTableName(DBTables.Game)} WHERE id=${id} LIMIT 1;
            `.trim();
            var that = this;
            this.runQueryReturning(query).then(function(result: GameReturn) {
                that.processResult(result);
                ret = result;
            });
            return ret;
        }
    }
}