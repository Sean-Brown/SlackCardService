import {TeamReturn} from "../return/db_return";
var Q = require("q");
export interface ITeamActions {
    /**
     * Create a new team
     * @param name the team
     * @return {Q.Promise<TeamReturn>} a promise to return the newly created row
     */
    create(name:string):Q.Promise<TeamReturn>;

    /**
     * Find a Team by name
     * @param name
     * @return {Q.Promise<TeamReturn>} a promise to return the row corresponding to the Team
     */
    findByName(name:string):Q.Promise<TeamReturn>;

    /**
     * Find a Team by ID
     * @param id
     * @return {Q.Promise<TeamReturn>} a promise to return the row corresponding to the Team
     */
    find(id:number):Q.Promise<TeamReturn>;
}