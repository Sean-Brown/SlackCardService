import {DBColumnDef, eDBColumn, eDBColumnAttr, DBColumnAttr} from "../columns/columns";
export enum DBTables {
    Game,
    GameHistory,
    GameHistoryPlayer,
    HandHistory,
    Player,
    WinLossHistory
}

export abstract class BaseTable {
    /**
     * The ID of this player in the database.
     * Primary key, auto-incrementing.
     */
    id:number;

    constructor() {
        this.id = this.getNextID();
    }

    /**
     * Get the next ID for a row in the table
     * @returns {number} the next ID in this table
     * TODO implement getNextID()!!
     */
    private getNextID():number {
        var id:number = 0;
        switch (this.getTable()) {
            case DBTables.Game:
                break;
            case DBTables.GameHistory:
                break;
            case DBTables.GameHistoryPlayer:
                break;
            case DBTables.HandHistory:
                break;
            case DBTables.Player:
                break;
            case DBTables.WinLossHistory:
                break;
        }
        return id;
    }

    abstract getTable():DBTables;
}

export class BaseTableDef {
    static ID_DEF:DBColumnDef = new DBColumnDef(
        BaseTableDef.ID_COL,
        eDBColumn.Integer,
        [
            new DBColumnAttr(eDBColumnAttr.AutoIncrement),
            new DBColumnAttr(eDBColumnAttr.PrimaryKey)
        ]
    );
    public static get ID_COL() { return "id" };
}