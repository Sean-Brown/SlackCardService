import {GameReturn} from "../return/db_return";
export interface IGameActions {
    /**
     * Create a new game
     * @param name the game
     * @return {GameReturn} the newly created row
     */
    create(name:string):GameReturn;

    /**
     * Find a game by name
     * @param name
     */
    find(name:string):GameReturn;

    /**
     * Find a game by ID
     * @param id
     */
    find(id:number):GameReturn;
}