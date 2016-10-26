import {BaseTable, DBTables} from "./base_table";
export class Player extends BaseTable {
    /**
     * The name of the player.
     * Unique
     */
    name:string;

    /**
     * The date the player joined.
     * Automatic
     */
    joined:number;

    constructor(id:number, name:string) {
        super(id);
        this.name = name;
    }

    getTable():DBTables {
        return DBTables.Player;
    }
}