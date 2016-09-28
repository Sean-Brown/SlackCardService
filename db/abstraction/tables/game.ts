import {BaseTable, DBTables, BaseTableDef} from "./base_table";
import {DBColumnDef, eDBColumn, DBColumnAttr, eDBColumnAttr} from "../columns/columns";
export class Game extends BaseTable {
    /**
     * The name of the game
     * Unique
     */
    name:string;

    constructor(name:string) {
        super();
        this.name = name;
    }

    getTable():DBTables {
        return DBTables.Game;
    }
}

export class GameDef extends BaseTableDef {
    nameDef:DBColumnDef = new DBColumnDef(
        GameDef.NAME_COL,
        eDBColumn.VarChar,
        [new DBColumnAttr(eDBColumnAttr.Unique)]
    );
    public static get NAME_COL() { return "name" };
}