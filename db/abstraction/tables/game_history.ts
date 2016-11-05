import {BaseTable, DBTables} from "./base_table";
export class GameHistory extends BaseTable {
    /**
     * The ID of the game
     * FK Game.id
     */
    game_id:number;
    public static get COL_GAME_ID():string { return "game_id"; }

    /**
     * When the game began
     * Automatic
     */
    began:number;
    public static get COL_BEGAN():string { return "began"; }

    /**
     * When the game ended
     * Nullable
     */
    ended:number;
    public static get COL_ENDED():string { return "ended"; }

    constructor(id:number, game_id:number) {
        super(id);
        this.game_id = game_id;
        //this.began = Date.now();
        this.ended = 0;
    }

    getTable():DBTables {
        return DBTables.GameHistory;
    }
}
