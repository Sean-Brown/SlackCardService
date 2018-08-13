import { Sequelize } from 'sequelize-typescript';
import { SequelizeConfig } from 'sequelize-typescript/lib/types/SequelizeConfig';

export class Manager {

    readonly sequelize: Sequelize;

    /**
     * @param options {SequelizeConfig} the database options. Note: modelPaths is not required.
     */
    constructor(options: SequelizeConfig) {
        if (options.modelPaths.length === 0) {
            options.modelPaths = [__dirname + '/models'];
        }
        this.sequelize = new Sequelize(options);
    }

}
