import {BaseTable, DBTables} from "./base_table";
export class WinLossHistory extends BaseTable {
    /**
     * The ID of the player
     * FK Player.id
     */
    player_id:number;

    /**
     * The ID of the game history
     * FK GameHistory.id
     */
    game_history_id:number;

    /**
     * true = won, false = lost
     */
    won:boolean;

    constructor(player_id:number, game_history_id:number, won:boolean=false) {
        super();
        this.player_id = player_id;
        this.game_history_id = game_history_id;
        this.won = won;
    }

    getTable():DBTables {
        return DBTables.WinLossHistory;
    }
}