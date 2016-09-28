import {IDatabaseActions} from "../../../abstraction/interfaces/idatabase_actions";
import {DBColumnDef} from "../../../abstraction/columns/columns";
import {BaseDBReturn} from "../../../abstraction/return/db_return";
import {getColumn} from "../columns/columns";
export class PostgresDatabase implements IDatabaseActions {
    constructor() {

    }
    createTable(name:string, columns:Array<DBColumnDef>):BaseDBReturn {
        var ret:BaseDBReturn = new BaseDBReturn();

        // A Javascripty way of doing a StringBuilder
        var query = [];
        query.push(`CREATE TABLE ${name} (`);
        for (var colDef of columns) {
            query.push(`${colDef.name} ${getColumn(colDef.colType)}`);
        }

        return ret;
    }
}