import {BaseTable, DBTables} from "./base_table";
export class Player extends BaseTable {
    /**
     * The name of the player.
     * Unique
     */
    username:string;

    /**
     * The date the player joined.
     * Automatic
     */
    joined:number;

    constructor(username:string) {
        super();
        this.username = username;
        this.joined = Date.now();
    }

    getTable():DBTables {
        return DBTables.Player;
    }
}