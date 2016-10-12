import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createModel, CreateModel, getModelErrorStr} from "./create_table";
import {PlayerReturn, DBReturnStatus} from "../db_return";
var Q = require("q");

interface Player {
    name?: string;
    joined?: Date;
}
interface Instance extends Sequelize.Instance<Player>, Player { }
export interface PlayerModel extends Sequelize.Model<Instance, Player> {
}

/** Implementation of the CreateModel interface */
class CreatePlayerModelImpl implements CreateModel<PlayerModel> {
    /**
     * Implement the CreateModel interface - create the player table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @param {string} schema the schema to create the model in
     * @returns {Promise<PlayerReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize:Sequelize.Sequelize, schema:string): Q.Promise<PlayerReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new PlayerReturn();
            const strTable = getTableName(DBTables.Player);
            createModel<PlayerModel, Player>(
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
                    tableName: strTable,
                    schema: schema
                }
            ).then((model:PlayerModel) => {
                ret.result = [model];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(getModelErrorStr(strTable));
                reject(ret);
            });
        });
    }
}
const creator = new CreatePlayerModelImpl();
/**
 * Create the player table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the model
 * @param {string} schema the schema to create the model in
 * @returns {Promise<Player>} returns the creation status along with the model, if the model was created successfully
 */
export function createPlayerModel(sequelize:Sequelize.Sequelize, schema:string): Q.Promise<PlayerReturn> {
    return creator.create(sequelize, schema);
}