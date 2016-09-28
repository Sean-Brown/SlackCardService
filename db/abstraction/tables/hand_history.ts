import {BaseTable, DBTables} from "./base_table";
export class HandHistory extends BaseTable {
    /**
     * ID of the player this hand is for
     * FK Player.id
     */
    player_id:number;

    /**
     * ID of the game this hand was in
     * FK GameHistory.ID
     */
    game_history_id:number;

    /**
     * The player's hand
     * This is a hyphen-delimited shorthand form of the hand, e.g.
     * 7h-3s-10c-kh-qd for "seven of hearts"-"three of spades"-
     * "ten of clubs"-"king of hearts"-"queen of diamonds"
     */
    hand:string;

    /**
     * Date this hand was received, in the form of a number
     * Automatic
     */
    received:number;

    constructor(player_id:number, game_history_id:number, hand:string="") {
        super();
        this.player_id = player_id;
        this.game_history_id = game_history_id;
        this.hand = hand;
        this.received = Date.now();
    }

    getTable():DBTables {
        return DBTables.HandHistory;
    }
}