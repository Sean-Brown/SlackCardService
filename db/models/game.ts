import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createTable, id, CreateTable, createTableErrorStr} from "./create_table";
import {GameReturn, DBReturnStatus} from "../db_return";
var Q = require("q");

interface Game {
    id?: number;
    name?: string;
}
interface Instance extends Sequelize.Instance<Game>, Game { }
export interface GameTable extends Sequelize.Model<Instance, Game> {
}

/** Implementation of the CreateTable interface */
class CreateGameTableImpl implements CreateTable<GameTable> {
    /**
     * Implement the CreateTable interface - create the game table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize: Sequelize.Sequelize): Q.Promise<GameReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new GameReturn();
            const strTable = getTableName(DBTables.Game);
            createTable<GameTable, Game>(
                sequelize,
                strTable,
                {
                    id,
                    name: {
                        type: Sequelize.STRING, allowNull: false
                    }
                },
                {
                    tableName: getTableName(DBTables.Game),
                }
            ).then((model:GameTable) => {
                ret.result = [model];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(createTableErrorStr(strTable));
                reject(ret);
            });
        });
    }
}
const creator = new CreateGameTableImpl();
/**
 * Create the game table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function CreateGameTable(sequelize:Sequelize.Sequelize): Q.Promise<GameReturn> {
    return creator.create(sequelize);
}