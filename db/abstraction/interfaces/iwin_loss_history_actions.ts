import {WinLossHistoryReturn} from "../return/db_return";
export interface IWinLossHistoryActions {
    /**
     * Create a new win-loss history record
     * @param player_id the ID of the player who won/lost
     * @param game_history_id the ID of the GameHistory that was won/lost
     * @param won boolean indicating if this player won the game
     * @return {WinLossHistoryReturn} the newly created row
     */
    create(player_id:number, game_history_id:number, won:boolean):JQueryPromise<WinLossHistoryReturn>;
}