import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createTable, CreateTable, createTableErrorStr} from "./create_table";
import {PlayerReturn, DBReturnStatus} from "../db_return";
var Q = require("q");

interface Player {
    name?: string;
    joined?: Date;
}
interface Instance extends Sequelize.Instance<Player>, Player { }
export interface PlayerTable extends Sequelize.Model<Instance, Player> {
}

/** Implementation of the CreateTable interface */
class CreatePlayerTableImpl implements CreateTable<PlayerTable> {
    /**
     * Implement the CreateTable interface - create the player table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @returns {Promise<PlayerReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize:Sequelize.Sequelize): Q.Promise<PlayerReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new PlayerReturn();
            const strTable = getTableName(DBTables.Player);
            createTable<PlayerTable, Player>(
                sequelize,
                strTable,
                {
                    name: {
                        type: Sequelize.STRING(128), unique: true, allowNull: false
                    },
                    joined: {
                        type: Sequelize.DATE
                    }
                },
                {
                    tableName: strTable
                }
            ).then((model:PlayerTable) => {
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
const creator = new CreatePlayerTableImpl();
/**
 * Create the player table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @returns {Promise<Player>} returns the creation status along with the model, if the table was created successfully
 */
export function CreatePlayerTable(sequelize:Sequelize.Sequelize): Q.Promise<PlayerReturn> {
    return creator.create(sequelize);
}