import {Sequelize as Sqlize, DefineAttributes, DefineOptions} from "sequelize";
import Sequelize = require("sequelize");
import {DBReturn} from "../db_return";
var Q = require("q");

export function getModelErrorStr(table:string) {
    return `error creating table ${table}`;
}

export interface CreateModel<Result> {
    create(...args:any[]):Q.Promise<DBReturn<Result>>;
}

export function createModel<TInstance, TAttributes>(sequelize:Sqlize, table:string, attributes:DefineAttributes, options:DefineOptions<TInstance>=null): Q.Promise<TInstance> {
    return new Q.Promise((resolve, reject) => {
        try {
            var model = sequelize.define(table, attributes, options);
            model.sync()
                .then(() => {
                    resolve(model);
                })
                .catch(() => {
                    console.log(getModelErrorStr(table));
                    reject(null);
                });
        }
        catch(e) {
            console.log(e.message);
            reject(null);
        }
    });
}

