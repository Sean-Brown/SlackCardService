import {BaseTable, DBTables} from "./base_table";
export class Player extends BaseTable {
    /**
     * The name of the player.
     * Unique
     */
    name:string;
    public static get COL_NAME():string { return "name"; }

    /**
     * The date the player joined.
     * Automatic
     */
    joined:number;
    public static get COL_JOINED():string { return "joined"; }

    constructor(id:number, name:string) {
        super(id);
        this.name = name;
    }

    getTable():DBTables {
        return DBTables.Player;
    }
}