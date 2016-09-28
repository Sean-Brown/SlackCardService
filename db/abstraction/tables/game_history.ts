import {BaseTable, DBTables, BaseTableDef} from "./base_table";
import {DBColumnDef, eDBColumn, eDBColumnAttr, DBColumnAttr} from "../columns/columns";
import {GameDef} from "./game";
export class GameHistory extends BaseTable {
    /**
     * The ID of the game
     * FK Game.id
     */
    game_id:number;

    /**
     * When the game began
     * Automatic
     */
    began:number;

    /**
     * When the game ended
     * Nullable
     */
    ended:number;

    constructor(game_id:number) {
        super();
        this.game_id = game_id;
        this.began = Date.now();
        this.ended = 0;
    }

    getTable():DBTables {
        return DBTables.GameHistory;
    }
}

export class GameHistoryDef extends BaseTableDef  {
    game_idDef:DBColumnDef = new DBColumnDef(
        GameHistoryDef.GAME_ID_COL,
        eDBColumn.Integer,
        // Foreign key on the Game table
        [new DBColumnAttr(eDBColumnAttr.References, [typeof(GameDef)])]
    );
    public static get GAME_ID_COL() { return "game_id"; }

    beganDef:DBColumnDef = new DBColumnDef(
        GameHistoryDef.BEGAN_COL,
        eDBColumn.TimeStamp
    );
    public static get BEGAN_COL() { return "began"; }

    endedDef:DBColumnDef = new DBColumnDef(
        GameHistoryDef.ENDED_COL,
        eDBColumn.TimeStamp
    );
    public static get ENDED_COL() { return "ended"; }

}