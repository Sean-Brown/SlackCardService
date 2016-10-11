import * as Sequelize from "sequelize";
import {createCribbageHandHistoryModel, CribbageHandHistoryModel} from "./models/cribbage_hand_history";
import {createGameModel, GameModel} from "./models/game";
import {createGameHistoryModel, GameHistoryModel} from "./models/game_history";
import {createPlayerModel, PlayerModel} from "./models/player";
import {createWinLossHistoryModel, WinLossHistoryModel} from "./models/win_loss_history";
import {
    GameReturn, PlayerReturn, DBReturn, GameHistoryReturn, CribbageHandHistoryReturn,
    WinLossHistoryReturn
} from "./db_return";
var Q = require("q");
var async = require("async");

export class DBManagerStrings {
    public static get InvalidDbType():string {
        return `Invalid Database type given, choose from ${DBType.Postgres}, ${DBType.MySql}, ${DBType.MsSql}, or ${DBType.Sqlite}`;
    }
    public static get HostError():string { return "Invalid Postgres host, specify the host as the PG_HOST environment variable"; }
    public static get PortError():string { return "Invalid Postgres port, specify the port as the PG_PORT environment variable"; }
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

class DBConfig {
    dbType:string;
    host:string;
    port:number;
    schema:string;
    database:string;
    user:string;
    password:string;
}

class DBModels {
    gameModel:GameModel;
    playerModel:PlayerModel;
    gameHistoryModel:GameHistoryModel;
    cribbageHandHistoryModel:CribbageHandHistoryModel;
    winLossHistoryModel:WinLossHistoryModel;
}

class DBManager {
    private sequelize:Sequelize.Sequelize;
    private config:DBConfig;
    private models:DBModels;
    constructor() {
        this.config = new DBConfig();
        this.models = new DBModels();
        this.readConfig();
    }

    /**
     * Initialize sequelize
     * @param {string} altSchema the alternate schema to use -- useful for debugging
     * @returns {Q.Promise<any>} the result of sequelize.createSchema
     */
    public initialize(altSchema:string=""): Q.Promise<any> {
        // Read the configuration
        this.readConfig();
        const finalSchema = this.getFinalSchema(altSchema);
        this.sequelize = new Sequelize(
            this.config.database, this.config.user, this.config.password, {
                dialect: this.config.dbType,
                host: this.config.host,
                port: this.config.port
            }
        );
        return this.sequelize.createSchema(finalSchema)
            .then(() => {
                return new Q.Promise((resolve, reject) => {
                    this.sequelize.sync({schema: finalSchema})
                        .then(() => {
                            resolve("");
                        })
                        .catch((err:any) => {
                            reject(err);
                        });
                });
            })
            .catch((err:any) => {
                console.log(err);
                return new Q.Promise().reject(err);
            });
    }

    /**
     * Authenticate with the database
     * @param {string} altSchema the schema to use, useful for debugging
     * @returns {Q.Promise} empty if successful, otherwise it's an error string
     */
    public authenticate(altSchema:string=""): Q.Promise<string> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
            if (that.sequelize == null) {
                // The class hasn't been initialized, initialize it
                that.initialize(altSchema)
                    .then(() => {
                        that.sequelize.authenticate()
                            .then(() => {
                                resolve("");
                            })
                            .catch((err:any) => {
                                reject(err);
                            });
                    })
                    .catch((err:any) => {
                        console.log(err);
                        reject(err);
                    });
            }
            else {
                that.sequelize.authenticate()
                    .then(() => { resolve(""); })
                    .catch((err:string) => { reject(err); });
            }
        });
    }

    /**
     * Read the database configuration from the environment variables
     * @returns {string} an error message, if an error occurred
     * @private
     */
    private readConfig():string {
        var error = "";
        try {
            this.config.dbType = process.env.DB_TYPE;
            if (this.config.dbType == null || this.config.dbType.length == 0) {
                throw DBManagerStrings.InvalidDbType;
            }
            else {
                switch (this.config.dbType) {
                    case DBType.Postgres:
                        break;
                    default:
                        throw `Database type ${this.config.dbType} is not implemented`;
                }
            }
            this.config.host = process.env.DB_HOST;
            if (this.config.host == null || this.config.host.length == 0) {
                throw DBManagerStrings.HostError;
            }
            this.config.port = process.env.DB_PORT;
            if (this.config.port == null || this.config.port == 0) {
                throw DBManagerStrings.PortError;
            }
            this.config.schema = process.env.DB_SCHEMA;
            if (this.config.schema == null || this.config.schema.length == 0) {
                // Allow for an empty schema, use a default value
                this.config.schema = "slack_card_service"
            }
            this.config.database = process.env.DB_DB;
            if (this.config.database == null || this.config.database.length == 0) {
                throw DBManagerStrings.DatabaseError;
            }
            this.config.user = process.env.DB_USER;
            if (this.config.user == null || this.config.user.length == 0) {
                throw DBManagerStrings.UserError;
            }
            this.config.password = process.env.DB_PASS;
            if (this.config.password == null || this.config.password.length == 0) {
                throw DBManagerStrings.PasswordError;
            }
        }
        catch (e) {
            error = e;
        }
        return error;
    }

    /**
     * Check the 'create model' result and push the error message if one occurred
     * @param {DBReturn<any>} result the create model result
     * @param message {Array<string>} the error messages that have occurred thus far
     * @returns {boolean} true if the result has no error, false if there was an error
     */
    private checkResult(result:DBReturn<any>, message:Array<string>):boolean {
        var ok = true;
        if (result.message.length > 0) {
            message.push(`error: ${result.message}`);
            ok = false;
        }
        return ok;
    }

    private getFinalSchema(altSchema:string):string {
        return (altSchema.length > 0 ? altSchema : this.config.schema);
    }

    /**
     * Create the models/tables in the database
     * @param {string} altSchema the schema to use, useful for debugging
     * @returns {Q.Promise} empty if successful, otherwise it's an error string
     */
    public createModels(altSchema:string=""): Q.Promise<string> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
            var message = [];
            // Make this asynchronous list of tasks run in sequence so the tables get created correctly
            var series = [
                (cb) => {
                    that.initialize(altSchema)
                        .finally(() => { cb(); });
                },
                (cb) => {
                    createGameModel(that.sequelize)
                        .then((result:GameReturn) => {
                            if (that.checkResult(result, message)) {
                                that.models.gameModel = result.first();
                            }
                        })
                        .catch((err:any) => {
                            console.log(err);
                        })
                        .finally(() => { cb(); });
                },
                (cb) => {
                    createPlayerModel(that.sequelize)
                        .then((result:PlayerReturn) => {
                            if (that.checkResult(result, message)) {
                                that.models.playerModel = result.first();
                            }
                        })
                        .finally(() => { cb(); });
                },
                (cb) => {
                    createGameHistoryModel(that.sequelize, that.models.gameModel)
                        .then((result:GameHistoryReturn) => {
                            if (that.checkResult(result, message)) {
                                that.models.gameHistoryModel = result.first();
                            }
                        })
                        .finally(() => { cb(); });
                },
                (cb) => {
                    createCribbageHandHistoryModel(that.sequelize, that.models.playerModel, that.models.gameHistoryModel)
                        .then((result:CribbageHandHistoryReturn) => {
                            if (that.checkResult(result, message)) {
                                that.models.cribbageHandHistoryModel = result.first();
                            }
                        })
                        .finally(() => { cb(); });
                },
                (cb) => {
                    createWinLossHistoryModel(that.sequelize, that.models.playerModel, that.models.gameHistoryModel)
                        .then((result:WinLossHistoryReturn) => {
                            if (that.checkResult(result, message)) {
                                that.models.winLossHistoryModel = result.first();
                            }
                        })
                        .finally(() => { cb(); });
                }
            ];
            async.series(series, () => {
                // Join all the error messages together into one message to resolve on
                var finalMessage = message.join("\n").replace(/\n$/, "");
                if (finalMessage.length > 0) {
                    reject(finalMessage);
                }
                else {
                    resolve(finalMessage);
                }
            });
        });
    }

    /**
     * Delete the tables in the database schema. Use for testing
     * @param {string} altSchema the schema to drop (one that was not the one configured in the .env file)
     * @TODO figure out how to get this out of production code through the build process
     */
    public dropSchema(altSchema:string=""): Q.Promise<string> {
        var that = this;
        const finalSchema = this.getFinalSchema(altSchema);
        return new Q.Promise((resolve, reject) => {
            that.sequelize.dropSchema(finalSchema, {logging: function(line:any) {
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