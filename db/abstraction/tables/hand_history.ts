import {BaseTable} from "./base_table";
/**
 * Abstract table that "hand history" tables should derive from.
 * This assumes a hand has a least a string of cards, but in cases like
 * Cribbage the hand also includes the cut card. Similarly, a game like
 * Texas Hold 'em could derive from HandHistory and include the flop,
 * turn, and river cards.
 */
export abstract class HandHistory extends BaseTable {
    /**
     * ID of the player this hand is for
     * FK Player.id
     */
    player_id:number;
    public static get COL_PLAYER_ID():string { return "player_id"; }

    /**
     * ID of the game this hand was in
     * FK GameHistory.ID
     */
    game_history_id:number;
    public static get COL_GAME_HISTORY_ID():string { return "game_history_id"; }

    /**
     * The player's hand EXCLUDING the cut card
     * This is a hyphen-delimited shorthand form of the hand, e.g.
     * 7h-3s-10c-kh-qd for "seven of hearts"-"three of spades"-
     * "ten of clubs"-"king of hearts"-"queen of diamonds"
     */
    hand:string;
    public static get COL_HAND():string { return "hand"; }

    /**
     * Date this hand was received, in the form of a number
     * Automatic
     */
    received:number;
    public static get COL_RECEIVED():string { return "received"; }

    constructor(id:number, player_id:number, game_history_id:number, hand:string="") {
        super(id);
        this.player_id = player_id;
        this.game_history_id = game_history_id;
        this.hand = hand;
    }
}