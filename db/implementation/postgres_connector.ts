import {ConnectionConfig} from "pg";
import {Client} from "pg";
import {QueryResult} from "pg";
import {Query} from "pg";
import {IDBConnector} from "../abstraction/idbconnector";
var Q = require("q");

class PGConfig implements ConnectionConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    constructor(host:string, port:number, database:string, user:string, password:string) {
        this.host = host;
        this.port = port;
        this.database = database;
        this.user = user;
        this.password = password;
    }
}

/** Base Postgres query return object */
export class PGReturnBase<ValueType> {
    // The value object
    value: ValueType;
    // An error message, if an error occurred
    error: string;
    constructor(result: ValueType = null, error:string = "") {
        this.value = result;
        this.error = error;
    }
    // Set an error message an make the value null
    public setError(error:string) {
        this.value = null;
        this.error = error;
    }
}
/** Postgres query return object returning a QueryResult */
export class PGQueryReturn extends PGReturnBase<QueryResult> { }
/** Postgres return object returning a Client that's connected to Postgres */
export class PGConnectionReturn extends PGReturnBase<Client> { }

export class PGManagerStrings {
    public static get HostError():string { return "Invalid Postgres host, specify the host as the PG_HOST environment variable"; }
    public static get PortError():string { return "Invalid Postgres port, specify the port as the PG_PORT environment variable"; }
    public static get DatabaseError():string { return "Invalid Postgres database, specify the database as the PG_DB environment variable"; }
    public static get UserError():string { return "Invalid Postgres user, specify the user as the PG_USER environment variable"; }
    public static get PasswordError():string { return "Invalid Postgres password, specify the password as the PG_PASS environment variable"; }
}
/**
 * Manages Postgres connections and queries
 */
class PostgresConnector implements IDBConnector {
    config: PGConfig;
    initialized: boolean;
    constructor() {
        this.initialized = false;
    }

    public init(host:string, port:number, database:string, user:string, password:string) {
        this.config = new PGConfig(host, port, database, user, password);
        this.initialized = true;
    }

    protected query(query:string, values: any[], callback?: (err: Error, result: QueryResult) => void): Query {
        var client = new Client(this.config);
        return client.query(query, values, callback);
    }

    /**
     * Run the given query and throw an error if the query fails
     * @param query the query to run
     * @returns {Q.<QueryResult>} a promise that will resolve on a QueryResult or reject with null if the query fails
     */
    protected runQuery(query:string): Q.Promise<PGQueryReturn> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
            // Connect to Postgres asynchronously: wait for the connection to resolve
            var pgResult = new PGQueryReturn();
            that.connect()
                .then((pgConn: PGConnectionReturn) => {
                    // Connected to Postgres, now query Postgres through the client
                    pgConn.value.query(query, null, function(err: Error, result: QueryResult) {
                        // We're in the callback function, terminate our Postgres connection
                        pgConn.value.end();
                        pgResult.value = result;
                        if (err != null) {
                            // There was an error, set an error message
                            console.log(`Query <${query}> returned ${err.message.toString()}`);
                            pgResult.setError(err.message.toString());
                            // Reject with the value
                            reject(pgResult);
                        }
                        else {
                            // Resolve on the value
                            resolve(pgResult);
                        }
                    })
                })
                .fail((pgConn: PGConnectionReturn) => {
                    if (pgConn.error.length > 0) {
                        // There was an error, set the error message
                        pgResult.setError(pgConn.error);
                    }
                    // Reject on the value
                    reject(pgResult);
                });
        });
    }

    /**
     * Connect to the Postgres database
     * @returns {Q.<PGConnectionReturn} a client connected to the Postgres database or null with an error message if a failure occurs
     */
    public connect(): Q.Promise<PGConnectionReturn> {
        var that = this;
        return new Q.Promise((resolve, reject) => {
            var client = new Client(that.config);
            var connection = new PGConnectionReturn(client);
            client.connect((err:Error) => {
                if (err != null) {
                    // An error occurred, end the client connection
                    client.end();
                    console.log(`Failed to connect to Postgres: ${err.message}`);
                    // Set the error message
                    connection.setError(err.message);
                    // Reject with the connection
                    reject(connection);
                }
                else {
                    // Succeeded, resolve the promise with the connection
                    resolve(connection);
                }
            });
        });
    }

    createSchemaAndDatabase(schema:string, database:string): Q.Promise<PGQueryReturn> {
        return this.runQuery(`
            
        `.trim());
    }
}
//export var pg_connector = new PostgresConnector();