import {WinLossHistoryReturn} from "../return/db_return";
import {WinLossHistory} from "../tables/win_loss_history";
export interface IWinLossHistoryActions {
    /**
     * Create a new win-loss history record
     * @param wlh the WinLossHistory object -- note the ID is ignored
     * @return {Q.Promise<WinLossHistoryReturn>} a promise to return the newly created row
     */
    create(wlh:WinLossHistory):Q.Promise<WinLossHistoryReturn>;

    /**
     * Create many win-loss history records
     * @param wlhs
     * @return {Q.Promise<WinLossHistoryReturn>} a promise to return the newly created rows
     */
    createMany(wlhs:Array<WinLossHistory>):Q.Promise<WinLossHistoryReturn>;

    /**
     * Find the win-loss history records associated with the given player
     * @param player the name of the player
     * @return {Q.Promise<WinLossHistoryReturn>} the win-loss-history rows associated with the player
     */
    get(player:string):Q.Promise<WinLossHistoryReturn>;
}