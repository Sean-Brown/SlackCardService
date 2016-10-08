import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createTable, CreateTable, createTableErrorStr} from "./create_table";
import {PlayerTable} from "./player";
import {CribbageHandHistoryReturn, DBReturnStatus} from "../db_return";
import {GameHistoryTable} from "./game_history";
var Q = require("q");

interface CribbageHandHistory {
    player_id?: number;
    game_id?: number;
    hand?: string;
    cut?: string;
}
interface Instance extends Sequelize.Instance<CribbageHandHistory>, CribbageHandHistory { }
export interface CribbageHandHistoryTable extends Sequelize.Model<Instance, CribbageHandHistory> {
}

/** Implementation of the CreateTable interface */
class CreateCribbageHandHistoryTableImpl implements CreateTable<CribbageHandHistoryTable> {
    /**
     * Implement the CreateTable interface - create the game table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @param {PlayerTable} playerModel the return value of CreatePlayerTable()
     * @param {GameHistoryTable} gameHistoryModel the return value of CreateGameTable()
     * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize:Sequelize.Sequelize, playerModel:PlayerTable, gameHistoryModel:GameHistoryTable): Q.Promise<CribbageHandHistoryReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new CribbageHandHistoryReturn();
            const strTable = getTableName(DBTables.CribbageHandHistory);
            createTable<CribbageHandHistoryTable, CribbageHandHistory>(
                sequelize,
                strTable,
                {
                    hand: {
                        type: Sequelize.STRING, allowNull: false
                    },
                    cut: {
                        type: Sequelize.STRING, allowNull: false
                    }
                },
                {
                    tableName: strTable,
                    underscored: true
                }
            ).then((cribbageHandHistory:CribbageHandHistoryTable) => {
                // create the foreign key associations
                playerModel.hasMany(cribbageHandHistory, {as: "cribbage_hands"});
                cribbageHandHistory.belongsTo(cribbageHandHistory, {as: "game_history"});
                // set the result and resolve the promise
                ret.result = [cribbageHandHistory];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(createTableErrorStr(strTable));
                reject(ret)
            });
        });
    }
}
const creator = new CreateCribbageHandHistoryTableImpl();
/**
 * Create the cribbage_hand_history table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @param {PlayerTable} playerModel the return value of CreatePlayerTable()
 * @param {GameHistoryTable} gameHistoryModel the return value of CreateGameTable()
 * @returns {Promise<CribbageHandHistoryReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function CreateCribbageHandHistoryTable(sequelize:Sequelize.Sequelize, playerModel:PlayerTable, gameHistoryModel:GameHistoryTable): Q.Promise<CribbageHandHistoryReturn> {
    return creator.create(sequelize, playerModel, gameHistoryModel);
}