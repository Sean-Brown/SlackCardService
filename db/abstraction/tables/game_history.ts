import {BaseTable, DBTables} from "./base_table";
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
