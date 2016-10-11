import {DBTables, getTableName} from "../db_tables";
import * as Sequelize from "sequelize";
import {createModel, CreateModel, getModelErrorStr} from "./create_table";
import {GameReturn} from "../db_return";
var Q = require("q");

interface Game {
    id?: number;
    name?: string;
}
interface Instance extends Sequelize.Instance<Game>, Game { }
export interface GameModel extends Sequelize.Model<Instance, Game> {
}

/** Implementation of the CreateModel interface */
class CreateGameModelImpl implements CreateModel<GameModel> {
    /**
     * Implement the CreateModel interface - create the game model
     * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the model
     * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
     */
    create(sequelize: Sequelize.Sequelize): Q.Promise<GameReturn> {
        return new Q.Promise((resolve, reject) => {
            let ret = new GameReturn();
            const strTable = getTableName(DBTables.Game);
            createModel<GameModel, Game>(
                sequelize,
                strTable,
                {
                    name: {
                        type: Sequelize.STRING, allowNull: false
                    }
                },
                {
                    tableName: getTableName(DBTables.Game),
                }
            ).then((model:GameModel) => {
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
const creator = new CreateGameModelImpl();
/**
 * Create the game table
 * @param {Sequelize.Sequelize} sequelize the sequelize instance that'll create the table
 * @returns {Promise<GameReturn>} returns the creation status along with the model, if the table was created successfully
 */
export function createGameModel(sequelize:Sequelize.Sequelize): Q.Promise<GameReturn> {
    return creator.create(sequelize);
}