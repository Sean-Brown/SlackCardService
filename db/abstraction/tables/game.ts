import {BaseTable, DBTables} from "./base_table";
export class Game extends BaseTable {
    /**
     * The name of the game
     * Unique
     */
    name:string;
    public static get COL_NAME():string { return "name"; }

    constructor(id:number, name:string) {
        super(id);
        this.name = name;
    }

    getTable():DBTables {
        return DBTables.Game;
    }
}
