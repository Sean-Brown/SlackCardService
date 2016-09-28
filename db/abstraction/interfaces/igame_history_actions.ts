import {GameHistoryReturn} from "../return/db_return";
export interface IGameHistoryActions {
    /**
     * Create a game history record
     * @param game_id
     * @return {GameHistoryReturn} the newly created row
     */
    create(game_id:number):GameHistoryReturn;

    /**
     * Find the most recent game history
     * @param game_id the ID of the game
     */
    findMostRecent(game_id:number):GameHistoryReturn;
}