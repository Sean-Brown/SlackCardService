import {GameReturn} from "../return/db_return";
var Q = require("q");
export interface IGameActions {
    /**
     * Create a new game
     * @param name the game
     * @return {GameReturn} the newly created row
     */
    create(name:string):Q.Promise<GameReturn>;

    /**
     * Find a game by name
     * @param name
     */
    findByName(name:string):Q.Promise<GameReturn>;

    /**
     * Find a game by ID
     * @param id
     */
    find(id:number):Q.Promise<GameReturn>;
}