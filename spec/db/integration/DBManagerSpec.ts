import {db_manager} from "../../../db/manager";
import {readConfigFromEnv} from "../../setEnv";
import {getRandomSchema} from "../randomSchema";

function dropSchemaAndFinish(schema:string, done:Function) {
    db_manager.dropSchema(schema).finally(() => { done(); });
}

describe("Test the database manager", function() {
    beforeEach(() => {
        readConfigFromEnv();
    });
    it("can connect to postgres", function(done) {
        const schema = getRandomSchema();
        db_manager.authenticate(schema)
            .catch((err:string) => {
                fail(err);
            })
            .finally(() => { dropSchemaAndFinish(schema, done); });
    });
    it("can create the tables", function(done) {
        const schema = getRandomSchema();
        db_manager.createModels(schema)
            .catch((err:Error) => {
                fail(err.message);
            })
            .finally(() => { dropSchemaAndFinish(schema, done); });
    });
});