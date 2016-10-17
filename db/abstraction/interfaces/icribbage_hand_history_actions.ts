import {CribbageHandHistoryReturn} from "../return/db_return";
import {CribbageHandHistory} from "../tables/cribbage_hand_history";
export interface ICribbageHandHistoryActions {
    /**
     * Create a CribbageHandHistory row in the database
     * @param {CribbageHandHistory} chh a CribbageHandHistory object -- note the ID will be ignored
     * @return {Q.Promise<CribbageHandHistoryReturn>} a promise that will return the newly created row
     */
    create(chh:CribbageHandHistory):Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Create many CribbageHandHistory rows
     * @param chhs an array of CribbageHandHistory objects -- note the IDs will be ignored
     */
    createMany(chhs:Array<CribbageHandHistory>):Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Remove the CribbageHandHistory records associated with the given GameHistory ID
     * @param game_history_id
     */
    remove(game_history_id:number):Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Get all the cribbage hands for a player in a game they played in
     * @param player_id
     * @param game_history_id
     */
    all(player_id:number, game_history_id:number):Q.Promise<CribbageHandHistoryReturn>;
}