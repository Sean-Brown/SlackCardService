import {GameHistoryPlayerReturn, CribbageHandHistoryReturn} from "../return/db_return";
export interface IGameHistoryPlayerPivotActions {
    /**
     * Create an association between a Player record and a GameHistory record
     * @param player_id the ID of the Player
     * @param game_history_id the ID of the GameHistory
     * @return {Q.Promise<GameHistoryPlayerReturn>} promise to return the newly created row
     */
    createAssociation(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerReturn>;

    /**
     * Create the association between each of the given playerIDs and the GameHistory record
     * @param player_ids
     * @param game_history_id
     * @return {Q.Promise<GameHistoryPlayerReturn>} promise to return the newly created rows
     */
    createAssociations(player_ids:Array<number>, game_history_id:number): Q.Promise<GameHistoryPlayerReturn>;

    /**
     * Find the game-history-player association in the database
     * @param player_id
     * @param game_history_id
     */
    findAssociation(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerReturn>;
}