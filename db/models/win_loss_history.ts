import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createModel, CreateModel, getModelErrorStr} from "./create_table";
import {WinLossHistoryReturn} from "../db_return";
import {PlayerModel} from "./player";
import {GameHistoryModel} from "./game_history";
var Q = require("q");

interface WinLossHistory {
    player_id: number;
    game_history_id: number;
    won?: boolean;
}
interface Instance extends Sequelize.Instance<WinLossHistory>, WinLossHistory { }
export interface WinLossHistoryModel extends Sequelize.Model<Instance, WinLossHistory> {
}

/** Implementation of the CreateModel interface */
class CreateWinLossHistoryModelImpl implements CreateModel<WinLossHistoryModel> {
    /**
     * Implement the CreateModel interface - create the win_loss_history table
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
     * @param {PlayerModel} playerModel the return value of CreatePlayerModel()
     * @param {GameHistoryModel} gameHistoryModel the return value of CreateGameTable()
     * @returns {Promise<PlayerReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize:Sequelize.Sequelize, playerModel:PlayerModel, gameHistoryModel:GameHistoryModel): Q.Promise<WinLossHistoryReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new WinLossHistoryReturn();
            const strTable = getTableName(DBTables.CribbageHandHistory);
            createModel<WinLossHistoryModel, WinLossHistory>(
                sequelize,
                strTable,
                {
                    won: {
                        type: Sequelize.BOOLEAN, defaultValue: false
                    }
                },
                {
                    tableName: strTable,
                    underscored: true
                }
            ).then((winLossHistory:WinLossHistoryModel) => {
                // create the associations
                playerModel.hasMany(winLossHistory);
                gameHistoryModel.hasMany(winLossHistory);
                // set the result and resolve the promise
                ret.result = [winLossHistory];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(getModelErrorStr(strTable));
                reject(ret);
            });
        });
    }
}
const creator = new CreateWinLossHistoryModelImpl();
/**
 * Create the win_loss_history table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the model
 * @param {PlayerModel} playerModel the return value of CreatePlayerModel()
 * @param {GameHistoryModel} gameHistoryModel the return value of CreateGameHistoryModel()
 * @returns {Promise<WinLossHistoryReturn>} returns the creation status along with the model, if the model was created successfully
 */
export function createWinLossHistoryModel(sequelize:Sequelize.Sequelize, playerModel:PlayerModel, gameHistoryModel:GameHistoryModel): Q.Promise<WinLossHistoryReturn> {
    return creator.create(sequelize, playerModel, gameHistoryModel);
}