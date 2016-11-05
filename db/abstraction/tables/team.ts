import {BaseTable, DBTables} from "./base_table";
export class Team extends BaseTable {
    /**
     * The name of the team
     * Unique
     */
    name:string;
    public static get COL_NAME():string { return "name"; }

    constructor(id:number, name:string) {
        super(id);
        this.name = name;
    }

    getTable():DBTables {
        return DBTables.Team;
    }
}
