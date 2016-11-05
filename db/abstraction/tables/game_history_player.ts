import {BaseTable, DBTables} from "./base_table";
/**
 * Pivot table that associates a game history with a player
 */
export class GameHistoryPlayerPivot extends BaseTable {
    /**
     * The ID of the game history
     * FK GameHistory.id
     */
    game_history_id:number;
    public static get COL_GAME_HISTORY_ID():string { return "game_history_id"; }

    /**
     * The ID of the player
     * FK Player.id
     */
    player_id:number;
    public static get COL_PLAYER_ID():string { return "player_id"; }

    constructor(id:number, player_id:number, game_history_id:number) {
        super(id);
        this.player_id = player_id;
        this.game_history_id = game_history_id;
    }

    getTable():DBTables {
        return DBTables.GameHistoryPlayer;
    }
}