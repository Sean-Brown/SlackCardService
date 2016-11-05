import {HandHistory} from "./hand_history";
import {DBTables} from "./base_table";
export class CribbageHandHistory extends HandHistory {
    /**
     * The cut card in short form, e.g. 5c for "five of clubs"
     */
    cut:string;
    public static get COL_CUT():string { return "cut"; }

    /**
     * True = the hand is somebody's crib, false (default) is a normal hand
     */
    is_crib:boolean;
    public static get COL_IS_CRIB():string { return "is_crib"; }

    /**
     * True = the hand was played to the end of the round
     * This is useful for determining where to start when resuming a game
     */
    played:boolean;
    public static get COL_PLAYED():string { return "played"; }

    /**
     * The number of points the player has so far
     */
    points:number;
    public static get COL_POINTS():string { return "points"; }

    constructor(id:number, player_id:number, game_history_id:number, hand:string="", cut:string="",
                is_crib:boolean=false, played:boolean=false, points:number=0) {
        super(id, player_id, game_history_id, hand);
        this.cut = cut;
        this.is_crib = is_crib;
        this.played = played;
        this.points = points;
    }

    getTable():DBTables {
        return DBTables.CribbageHandHistory;
    }
}