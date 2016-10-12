import {db_manager} from "../../../db/manager";
import {readConfigFromEnv} from "../../setEnv";
import {getRandomSchema} from "../randomSchema";

function dropSchemaAndFinish(schema:string, done:Function) {
    db_manager.dropSchema(schema.toLowerCase())
        .catch((err:any) => {
            console.log(err);
        })
        .finally(() => { done(); });
}

describe("Test the database manager", function() {
    beforeEach(() => {
        readConfigFromEnv();
    });
    it("can connect to postgres", function(done) {
        const schema = getRandomSchema();
        db_manager.authenticate(schema)
            .catch((err) => {
                fail(err);
            })
            .finally(() => {
                dropSchemaAndFinish(schema, done);
            });
    });
    it("can create the tables", function(done) {
        const schema = getRandomSchema();
        db_manager.createModels(schema.toLowerCase())
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                dropSchemaAndFinish(schema, done);
            });
    });
});