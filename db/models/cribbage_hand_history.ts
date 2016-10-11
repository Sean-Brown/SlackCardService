import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createModel, CreateModel, getModelErrorStr} from "./create_table";
import {PlayerModel} from "./player";
import {CribbageHandHistoryReturn} from "../db_return";
import {GameHistoryModel} from "./game_history";
var Q = require("q");

interface CribbageHandHistory {
    player_id?: number;
    game_id?: number;
    hand?: string;
    cut?: string;
}
interface Instance extends Sequelize.Instance<CribbageHandHistory>, CribbageHandHistory { }
export interface CribbageHandHistoryModel extends Sequelize.Model<Instance, CribbageHandHistory> {
}

/** Implementation of the CreateModel interface */
class CreateCribbageHandHistoryModelImpl implements CreateModel<CribbageHandHistoryModel> {
    /**
     * Implement the CreateModel interface - create the game model
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the model
     * @param {PlayerModel} playerModel the return value of CreatePlayerModel()
     * @param {GameHistoryModel} gameHistoryModel the return value of CreateGameModel()
     * @returns {Promise<GameReturn>} returns the creation status along with the model, if the model was created successfully
     */
    create(sequelize:Sequelize.Sequelize, playerModel:PlayerModel, gameHistoryModel:GameHistoryModel): Q.Promise<CribbageHandHistoryReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new CribbageHandHistoryReturn();
            const strTable = getTableName(DBTables.CribbageHandHistory);
            createModel<CribbageHandHistoryModel, CribbageHandHistory>(
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
            ).then((cribbageHandHistory:CribbageHandHistoryModel) => {
                // create the foreign key associations
                playerModel.hasMany(cribbageHandHistory, {as: "cribbage_hands"});
                cribbageHandHistory.belongsTo(cribbageHandHistory, {as: "game_history"});
                // set the result and resolve the promise
                ret.result = [cribbageHandHistory];
                resolve(ret);
            })
            .catch(() => {
                ret.setError(getModelErrorStr(strTable));
                reject(ret)
            });
        });
    }
}
const creator = new CreateCribbageHandHistoryModelImpl();
/**
 * Create the cribbage_hand_history model
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the model
 * @param {PlayerModel} playerModel the return value of CreatePlayerModel()
 * @param {GameHistoryModel} gameHistoryModel the return value of CreateGameModel()
 * @returns {Promise<CribbageHandHistoryReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function createCribbageHandHistoryModel(sequelize:Sequelize.Sequelize, playerModel:PlayerModel, gameHistoryModel:GameHistoryModel): Q.Promise<CribbageHandHistoryReturn> {
    return creator.create(sequelize, playerModel, gameHistoryModel);
}