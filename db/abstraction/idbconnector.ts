/**
 * Since Sequelize doesn't support database and schema creation, use an abstraction
 */
export interface IDBConnector {
    init(host:string, port:number, database:string, user:string, password:string): void;
    createSchemaAndDatabase(schema:string, database:string): Q.Promise<any>;
}