import {DBColumnDef} from "../columns/columns";
import {BaseDBReturn} from "../return/db_return";

/**
 * Interface for generic actions performed on a database
 */
export interface IDatabaseActions {
    createTable(name:string, columns:Array<DBColumnDef>):BaseDBReturn;
}