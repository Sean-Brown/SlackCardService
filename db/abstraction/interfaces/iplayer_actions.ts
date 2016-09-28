import {PlayerReturn} from "../return/db_return";

/**
 * Interface that stubs methods that are performed on the Player database table
 */
export interface IPlayerActions {
    /**
     * Create a new player
     * @param name of the player
     * @return {PlayerReturn} the newly created row
     */
    create(name:string):PlayerReturn;

    /**
     * Find a player by name
     * @param name
     */
    find(name:string):PlayerReturn;

    /**
     * Find a player by ID
     * @param id
     */
    find(id:number):PlayerReturn;
}