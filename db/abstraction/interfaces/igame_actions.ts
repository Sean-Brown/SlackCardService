import {GameReturn} from "../return/db_return";
var Q = require("q");
export interface IGameActions {
    /**
     * Create a new game
     * @param name the game
     * @return {Q.Promise<GameReturn>} a promise to return the newly created row
     */
    create(name:string):Q.Promise<GameReturn>;

    /**
     * Find a game by name
     * @param name
     * @return {Q.Promise<GameReturn>} a promise to return the row corresponding to the game
     */
    findByName(name:string):Q.Promise<GameReturn>;

    /**
     * Find a game by ID
     * @param id
     * @return {Q.Promise<GameReturn>} a promise to return the row corresponding to the game
     */
    find(id:number):Q.Promise<GameReturn>;
}