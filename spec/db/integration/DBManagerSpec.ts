import {DBManager} from "../../../db/manager";
import {readConfigFromEnv} from "../../setEnv";
import {getRandomSchema} from "../randomSchema";

function dropSchemaAndFinish(manager:DBManager, schema:string, done:Function) {
    manager.dropSchema(schema.toLowerCase())
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
        var manager = new DBManager();
        manager.initialize(schema)
            .then(() => {
                manager.authenticate(schema)
                    .catch((err) => {
                        fail(err);
                    });
            })
            .catch((err) => {
                fail(err);
            })
            .finally(() => {
                dropSchemaAndFinish(manager, schema, done);
            });
    });
    it("can create the tables", function(done) {
        const schema = getRandomSchema();
        var manager = new DBManager();
        manager.initialize(schema)
            .then(() => {
                manager.createModels(schema.toLowerCase())
                    .catch((err) => {
                        fail(err);
                    });
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                dropSchemaAndFinish(manager, schema, done);
            });
    });
});