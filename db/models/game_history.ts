import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createModel, CreateModel, getModelErrorStr} from "./create_table";
import {GameHistoryReturn, DBReturnStatus} from "../db_return";
import {GameModel} from "./game";
var Q = require("q");

interface GameHistory {
    id?: number;
    game_id?: number;
    began?: Date;
    ended?: Date;
}
interface Instance extends Sequelize.Instance<GameHistory>, GameHistory { }
export interface GameHistoryModel extends Sequelize.Model<Instance, GameHistory> {
}

/** Implementation of the CreateModel interface */
class CreateGameHistoryModelImpl implements CreateModel<GameHistoryModel> {
    /**
     * Implement the CreateModel interface - create the game_history table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @param {GameModel} gameModel the return value of CreateGameTable()
     * @param {string} schema the schema to create the model in
     * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize: Sequelize.Sequelize, schema:string, gameModel:GameModel): Q.Promise<GameHistoryReturn> {
        return Q.Promise((resolve, reject) => {
            let ret = new GameHistoryReturn();
            const strTable = getTableName(DBTables.GameHistory);
            createModel<GameHistoryModel, GameHistory>(
                sequelize,
                strTable,
                {
                    began: {
                        type: Sequelize.DATE
                    },
                    ended: {
                        type: Sequelize.DATE
                    },
                },
                {
                    tableName: strTable,
                    underscored: true,
                    timestamps: false,
                    schema: schema
                }
            ).then((gameHistoryTable:GameHistoryModel) => {
                // create the foreign key associations
                gameHistoryTable.belongsTo(gameModel);
                gameModel.hasMany(gameHistoryTable, {as: "history"});
                // set the result and resolve
                ret.result = [gameHistoryTable];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(getModelErrorStr(strTable));
                reject(ret);
            });
        });
    };
}
const creator = new CreateGameHistoryModelImpl();
/**
 * Create the game table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @param {string} schema the schema to create the model in
 * @param {GameModel} gameModel the return value of CreateGameTable()
 * @returns {Promise<GameHistoryReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function createGameHistoryModel(sequelize:Sequelize.Sequelize, schema:string, gameModel:GameModel): Q.Promise<GameHistoryReturn> {
    return creator.create(sequelize, schema, gameModel);
}