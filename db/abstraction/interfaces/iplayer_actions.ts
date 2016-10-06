import {PlayerReturn} from "../return/db_return";

/**
 * Interface that stubs methods that are performed on the Player database table
 */
export interface IPlayerActions {
    /**
     * Create a new player
     * @param name of the player
     * @return {Q.Promise<PlayerReturn>} the newly created row
     */
    create(name:string):Q.Promise<PlayerReturn>;

    /**
     * Find a player by name
     * @param name
     * @return {Q.Promise<PlayerReturn>}
     */
    findByName(name:string):Q.Promise<PlayerReturn>;

    /**
     * Find a player by ID
     * @param id
     * @return {Q.Promise<PlayerReturn>}
     */
    find(id:number):Q.Promise<PlayerReturn>;
}