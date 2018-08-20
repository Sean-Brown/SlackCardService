import { Sequelize } from 'sequelize-typescript';
import { SequelizeConfig } from 'sequelize-typescript/lib/types/SequelizeConfig';

const Op = Sequelize.Op;

// From the docs:
// "For better security it is highly advised to use Sequelize.Op and not depend on any string alias at all"
//
// Uncomment to enable operator aliases
const operatorsAliases = {
    // $eq: Op.eq,
    // $ne: Op.ne,
    // $gte: Op.gte,
    // $gt: Op.gt,
    // $lte: Op.lte,
    // $lt: Op.lt,
    // $not: Op.not,
    // $in: Op.in,
    // $notIn: Op.notIn,
    // $is: Op.is,
    // $like: Op.like,
    // $notLike: Op.notLike,
    // $iLike: Op.iLike,
    // $notILike: Op.notILike,
    // $regexp: Op.regexp,
    // $notRegexp: Op.notRegexp,
    // $iRegexp: Op.iRegexp,
    // $notIRegexp: Op.notIRegexp,
    // $between: Op.between,
    // $notBetween: Op.notBetween,
    // $overlap: Op.overlap,
    // $contains: Op.contains,
    // $contained: Op.contained,
    // $adjacent: Op.adjacent,
    // $strictLeft: Op.strictLeft,
    // $strictRight: Op.strictRight,
    // $noExtendRight: Op.noExtendRight,
    // $noExtendLeft: Op.noExtendLeft,
    // $and: Op.and,
    // $or: Op.or,
    // $any: Op.any,
    // $all: Op.all,
    // $values: Op.values,
    // $col: Op.col
};

export class Manager {

    private readonly sequelize: Sequelize;
    /**
     * @param options {SequelizeConfig} the database options. Note: modelPaths is not required.
     */
    constructor(options: SequelizeConfig) {
        if (!options.modelPaths || options.modelPaths.length === 0) {
            options.modelPaths = [__dirname + '/models'];
        }
        options.operatorsAliases = operatorsAliases;
        this.sequelize = new Sequelize(options);
    }

    createTables() {
        return this.sequelize.sync();
    }

    /**
     * Execute the given query - no escaping will be done
     * @param query
     */
    runLiteralQuery(query: string) {
        return this.sequelize.literal(query);
    }
}
