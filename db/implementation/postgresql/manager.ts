/// <reference path="../../../typings/index.d.ts" />
import {ConnectionConfig} from "pg";
import {Client} from "pg";
import {QueryResult} from "pg";
import {Query} from "pg";

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

/**
 * Manages Postgres connections and queries
 */
export class PGManager {
    config: PGConfig;
    constructor() {
        // Read the configuration settings from the environment
        this.readConfig();
    }

    public query(query:string, values: any[], callback?: (err: Error, result: QueryResult) => void): Query {
        var client = new Client(this.config);
        return client.query(query, values, callback);
    }

    /**
     * Read the Postgres configuration from the environment variables
     */
    protected readConfig() {
        var host:string = process.env.PG_HOST;
        if (host == null || host.length == 0) {
            throw "Invalid Postgres host, specify the host as the PG_HOST environment variable";
        }
        var port:number = process.env.PG_PORT;
        if (port == null || port == 0) {
            throw "Invalid Postgres port, specify the port as the PG_PORT environment variable";
        }
        var database:string = process.env.PG_DB;
        if (database == null || database.length == 0) {
            throw "Invalid Postgres database, specify the database as the PG_DB environment variable";
        }
        var user:string = process.env.PG_USER;
        if (user == null || user.length == 0) {
            throw "Invalid Postgres user, specify the user as the PG_USER environment variable";
        }
        var password:string = process.env.PG_PASS;
        if (password == null || password.length == 0) {
            throw "Invalid Postgres password, specify the password as the PG_PASS environment variable";
        }
        this.config = new PGConfig(host, port, database, user, password);
    }
}