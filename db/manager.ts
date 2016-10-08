import * as Sequelize from "sequelize";
import {createCribbageHandHistoryTable} from "./models/cribbage_hand_history";
import {createGameTable} from "./models/game";
import {createGameHistoryTable} from "./models/game_history";
import {createGameHistoryPlayerPivotTable} from "./models/game_history_player_pivot";
import {createPlayerTable} from "./models/player";
import {createWinLossHistoryTable} from "./models/win_loss_history";
var Sequelize = require("sequelize");
var Q = require("q");
var async = require("async");

export class DBManagerStrings {
    public static get InvalidDbType():string {
        return `Invalid Database type given, choose from ${DBType.Postgres}, ${DBType.MySql}, ${DBType.MsSql}, or ${DBType.Sqlite}`;
    }
    public static get HostError():string { return "Invalid Postgres host, specify the host as the PG_HOST environment variable"; }
    public static get PortError():string { return "Invalid Postgres port, specify the port as the PG_PORT environment variable"; }
    public static get SchemaError():string { return "Invalid Postgres schema, specify the database as the PG_SCHEMA environment variable"; }
    public static get DatabaseError():string { return "Invalid Postgres database, specify the database as the PG_DB environment variable"; }
    public static get UserError():string { return "Invalid Postgres user, specify the user as the PG_USER environment variable"; }
    public static get PasswordError():string { return "Invalid Postgres password, specify the password as the PG_PASS environment variable"; }
}

class DBType {
    public static get Postgres(): string { return "postgres"; }
    public static get MySql(): string { return "mysql"; }
    public static get MsSql(): string { return "mssql"; }
    public static get Sqlite(): string { return "sqlite"; }
}

class DBManager {
    constructor(private sequelize:Sequelize.Sequelize=null, private hasReadConfig:boolean=false) {
    }

    /**
     * Authenticate with the database
     * @returns {Q.Promise} empty if successful, otherwise it's an error string
     */
    public authenticate(): Q.Promise<string> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
            if (!that.hasReadConfig) {
                // The configuration hasn't been read yet, read it
                var error = that.readConfig();
                if (error.length > 0) {
                    // An error occurred, reject the promise
                    reject(error);
                }
                else {
                    that.hasReadConfig = true;
                }
            }
            that.sequelize.authenticate()
                .then(() => {
                    resolve("");
                })
                .catch((err:string) => {
                    reject(err);
                });
        });
    }

    /**
     * Read the database configuration from the environment variables
     * @returns {string} an error message, if an error occurred
     */
    public readConfig():Q.Promise<string> {
        try {
            var dbType:string = process.env.DB_TYPE;
            if (dbType == null || dbType.length == 0) {
                throw DBManagerStrings.InvalidDbType;
            }
            else {
                switch (dbType) {
                    case DBType.Postgres:
                        break;
                    default:
                        throw `Database type ${dbType} is not implemented`;
                }
            }
            var host:string = process.env.DB_HOST;
            if (host == null || host.length == 0) {
                throw DBManagerStrings.HostError;
            }
            var port:number = process.env.DB_PORT;
            if (port == null || port == 0) {
                throw DBManagerStrings.PortError;
            }
            var schema:string = process.env.DB_SCHEMA;
            if (schema == null || schema.length == 0) {
                throw DBManagerStrings.SchemaError;
            }
            var database:string = process.env.DB_DB;
            if (database == null || database.length == 0) {
                throw DBManagerStrings.DatabaseError;
            }
            var user:string = process.env.DB_USER;
            if (user == null || user.length == 0) {
                throw DBManagerStrings.UserError;
            }
            var password:string = process.env.DB_PASS;
            if (password == null || password.length == 0) {
                throw DBManagerStrings.PasswordError;
            }
            this.sequelize = new Sequelize(
                database, user, password, {
                    dialect: dbType,
                    host: host,
                    port: port,
                    schema: schema,
                }
            );
            return this.sequelize.createSchema(schema, function(line) {
                console.log(line);
            });
        }
        catch (e) {
            return new Q.Promise().thenReject(e);
        }
    }

    /**
     * Create a table in the database
     * @param createFunction the 'create table' function
     * @param cb the callback method to let async know that table creation is done
     * @param message an error message, if an error occurred
     */
    private createTable(createFunction:Function, args:Array<any>, cb:any, message:Array<string>) {
        createFunction.apply(args)
            .then((result:string) => {
                if (result.length > 0) {
                    message.push(`error: ${result}`);
                }
            })
            .finally(() => {
                cb();
            });
    }

    /**
     * Create the tables in the database
     * @returns {Q.Promise} empty if successful, otherwise it's an error string
     */
    public createTables(): Q.Promise<string> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
            var message = [];
            // Make this asynchronous list of tasks run in sequence so the tables get created correctly
            var gameTable = null;
            var series = [
                (cb) => {
                    that.createTable(createGameTable, [that.sequelize], cb, message);
                },
                (cb) => {
                    that.createTable(createPlayerTable, [that.sequelize], cb, message);
                },
                (cb) => {
                    that.createTable(createGameHistoryTable, [that.sequelize, cb, message);
                },
                (cb) => {
                    that.createTable(createCribbageHandHistoryTable, that.sequelize, cb, message);
                },
                (cb) => {
                    that.createTable(createWinLossHistoryTable, that.sequelize, cb, message);
                }
            ];
            async.series(series, () => {
                // Join all the error messages together into one message to resolve on
                resolve(message.join("\n").replace(/\n$/, ""));
            });
        });
    }

    /**
     * Delete the tables in the database. Use for testing
     * @TODO figure out how to get this out of production code through the build process
     */
    public deleteTables(): Q.Promise<string> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
             that.sequelize.dropAllSchemas({logging: function(line:any) {
                    console.log(line);
                }})
                 .then((result) => {
                     console.log(result);
                     resolve("");
                 })
                 .catch((result) => {
                    console.log(result);
                    reject("Unable to delete the tables, check the log");
                 });
        });
    }
}
export var db_manager = new DBManager();