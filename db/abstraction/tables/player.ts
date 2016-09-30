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
    //joined:number;

    constructor(id:number, username:string) {
        super(id);
        this.username = username;
        //this.joined = Date.now();
    }

    getTable():DBTables {
        return DBTables.Player;
    }
}