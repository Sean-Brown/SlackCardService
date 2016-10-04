import {GameHistoryReturn} from "../return/db_return";
export interface IGameHistoryActions {
    /**
     * Create a game history record
     * @param game_id
     * @return {Q.Promise<GameHistoryReturn>} the newly created row
     */
    create(game_id:number):Q.Promise<GameHistoryReturn>;

    /**
     * Find the most recent game history that has not ended
     * @param game_id the ID of the game
     * @return {Q.Promise<GameHistoryReturn>} the found row
     */
    findMostRecent(game_id:number):Q.Promise<GameHistoryReturn>;

    /**
     * End this game-history record (i.e. set the 'ended' date)
     * @param game_history_id
     * @return {Q.Promise<GameHistoryReturn>} the updated row
     */
    endGame(game_history_id:number):Q.Promise<GameHistoryReturn>;
}