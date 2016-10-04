import {GameHistoryPlayerReturn} from "../return/db_return";
export interface IGameHistoryPlayerPivotActions {
    /**
     * Create an association between a Player record and a GameHistory record
     * @param player_id the ID of the Player
     * @param game_history_id the ID of the GameHistory
     * @return {Q.Promise<GameHistoryPlayerReturn>} promise to return the newly created row
     */
    createAssociation(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerReturn>;
}