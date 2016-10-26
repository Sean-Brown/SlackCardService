import {HandHistory} from "./hand_history";
import {DBTables} from "./base_table";
export class CribbageHandHistory extends HandHistory {
    /**
     * The cut card in short form, e.g. 5c for "five of clubs"
     */
    cut:string;

    /**
     * True = the hand is somebody's crib, false (default) is a normal hand
     */
    is_crib:boolean;

    constructor(id:number, player_id:number, game_history_id:number, hand:string="", cut:string="", is_crib:boolean=false) {
        super(id, player_id, game_history_id, hand);
        this.cut = cut;
        this.is_crib = is_crib;
    }

    getTable():DBTables {
        return DBTables.CribbageHandHistory;
    }
}