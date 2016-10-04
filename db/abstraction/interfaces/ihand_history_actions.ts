import {HandHistoryReturn} from "../return/db_return";
export interface IHandHistoryActions {
    /**
     * Create a HandHistory row in the database
     * @param player_id the ID of the player who the hand belongs to
     * @param game_history_id the ID of the GameHistory this hand occurred in
     * @param hand the hand itself in the form "2s-kd-10c-8h"
     * @param cut the cut card in short form, e.g. 10c for "ten of clubs"
     * @return {Q.Promise<HandHistoryReturn>} a promise that will return the newly created row
     */
    create(player_id:number, game_history_id:number, hand:string, cut:string):Q.Promise<HandHistoryReturn>;
}