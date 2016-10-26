import {BaseTable, DBTables} from "./base_table";
export class Game extends BaseTable {
    /**
     * The name of the game
     * Unique
     */
    name:string;

    constructor(id:number, name:string) {
        super(id);
        this.name = name;
    }

    getTable():DBTables {
        return DBTables.Game;
    }
}
