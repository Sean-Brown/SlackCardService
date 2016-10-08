import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createTable, CreateTable, createTableErrorStr} from "./create_table";
import {GameHistoryReturn, DBReturnStatus} from "../db_return";
import {GameTable} from "./game";
var Q = require("q");

interface GameHistory {
    id?: number;
    game_id?: number;
    began?: Date;
    ended?: Date;
}
interface Instance extends Sequelize.Instance<GameHistory>, GameHistory { }
export interface GameHistoryTable extends Sequelize.Model<Instance, GameHistory> {
}

/** Implementation of the CreateTable interface */
class CreateGameHistoryTableImpl implements CreateTable<GameHistoryTable> {
    /**
     * Implement the CreateTable interface - create the game_history table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @param {GameTable} gameModel the return value of CreateGameTable()
     * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize: Sequelize.Sequelize, gameModel:GameTable): Q.Promise<GameHistoryReturn> {
        return Q.Promise((resolve, reject) => {
            let ret = new GameHistoryReturn();
            const strTable = getTableName(DBTables.GameHistory);
            createTable<GameHistoryTable, GameHistory>(
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
                }
            ).then((gameHistoryTable:GameHistoryTable) => {
                // create the foreign key associations
                gameHistoryTable.belongsTo(gameModel);
                gameModel.hasMany(gameHistoryTable, {as: "history"});
                // set the result and resolve
                ret.result = [gameHistoryTable];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(createTableErrorStr(strTable));
                reject(ret);
            });
        });
    };
}
const creator = new CreateGameHistoryTableImpl();
/**
 * Create the game table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @param {GameTable} gameModel the return value of CreateGameTable()
 * @returns {Promise<GameHistoryReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function CreateGameHistoryTable(sequelize:Sequelize.Sequelize, gameModel:GameTable): Q.Promise<GameHistoryReturn> {
    return creator.create(sequelize, gameModel);
}