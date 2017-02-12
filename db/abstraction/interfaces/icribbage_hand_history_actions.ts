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
     * Find the player's hands for the current game
     * @param player_id
     * @param game_history_id
     */
    findPlayerHandsInGame(player_id:number, game_history_id:number):Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Get all the Cribbage hands for a player in a game they played in
     * @param player_id
     * @param game_history_id
     */
    all(player_id:number, game_history_id:number):Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Set the 'played' boolean to 'true' for the player's latest hand in the given game
     * @param player_id
     * @param game_history_id
     * @param points the total number of points the player has
     */
    setHandPlayed(player_id:number, game_history_id:number, points:number):Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Get the player's points in the given game
     * @param player_id
     * @param game_history_id
     */
    getPoints(player_id:number, game_history_id:number): Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Get the player's last hand in the game, or null if they didn't have one
     * @param player_id
     * @param game_history_id
     */
    getLastHand(player_id:number, game_history_id:number): Q.Promise<CribbageHandHistoryReturn>;

    /**
     * Says whether or not the given game has unfinished hands to resume play from
     * @param game_history_id
     */
    hasUnplayedHands(game_history_id:number): Q.Promise<boolean>;
}