import {HandHistory} from "./hand_history";
import {DBTables} from "./base_table";
export class CribbageHandHistory extends HandHistory {
    /**
     * The cut card in short form, e.g. 5c for "five of clubs"
     */
    cut:string;

    constructor(id:number, player_id:number, game_history_id:number, hand:string="", cut:string="") {
        super(id, player_id, game_history_id, hand);
        this.cut = cut;
    }

    getTable():DBTables {
        return DBTables.CribbageHandHistory;
    }
}