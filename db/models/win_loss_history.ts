import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createTable, fk, CreateTable, createTableErrorStr} from "./create_table";
import {WinLossHistoryReturn, DBReturnStatus} from "../db_return";
import {PlayerTable} from "./player";
import {GameHistoryTable} from "./game_history";
var Q = require("q");

interface WinLossHistory {
    player_id: number;
    game_history_id: number;
    won?: boolean;
}
interface Instance extends Sequelize.Instance<WinLossHistory>, WinLossHistory { }
export interface WinLossHistoryTable extends Sequelize.Model<Instance, WinLossHistory> {
}

/** Implementation of the CreateTable interface */
class CreateWinLossHistoryTableImpl implements CreateTable<WinLossHistoryTable> {
    /**
     * Implement the CreateTable interface - create the win_loss_history table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @param {PlayerTable} playerModel the return value of CreatePlayerTable()
     * @param {GameHistoryTable} gameHistoryModel the return value of CreateGameTable()
     * @returns {Promise<PlayerReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize:Sequelize.Sequelize, playerModel:PlayerTable, gameHistoryModel:GameHistoryTable): Q.Promise<WinLossHistoryReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new WinLossHistoryReturn();
            const strTable = getTableName(DBTables.CribbageHandHistory);
            createTable<WinLossHistoryTable, WinLossHistory>(
                sequelize,
                strTable,
                {
                    player_id: fk(playerModel),
                    game_history_id: fk(gameHistoryModel),
                    won: {
                        type: Sequelize.BOOLEAN, defaultValue: false
                    }
                },
                {
                    tableName: strTable,
                    underscored: true
                }
            ).then((winLossHistory:WinLossHistoryTable) => {
                // create the associations
                playerModel.hasMany(winLossHistory);
                gameHistoryModel.hasMany(winLossHistory);
                // set the result and resolve the promise
                ret.result = [winLossHistory];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(createTableErrorStr(strTable));
                reject(ret);
            });
        });
    }
}
const creator = new CreateWinLossHistoryTableImpl();
/**
 * Create the win_loss_history table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @param {PlayerTable} playerModel the return value of CreatePlayerTable()
 * @param {GameHistoryTable} gameHistoryModel the return value of CreateGameHistoryTable()
 * @returns {Promise<WinLossHistoryReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function CreateWinLossHistoryTable(sequelize:Sequelize.Sequelize, playerModel:PlayerTable, gameHistoryModel:GameHistoryTable): Q.Promise<WinLossHistoryReturn> {
    return creator.create(sequelize, playerModel, gameHistoryModel);
}