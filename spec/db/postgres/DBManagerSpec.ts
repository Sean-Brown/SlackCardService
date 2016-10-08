import {db_manager} from "../../../db/manager";
import {readConfigFromEnv} from "../../setEnv";

describe("Test the database manager", function() {
    beforeEach(() => {
        readConfigFromEnv();
    });
    it("can connect to postgres", function(done) {
        db_manager.authenticate()
            .catch((err:string) => {
                fail(err);
            })
            .finally(() => { done(); });
    });
    it("can create the tables", function(done) {
        db_manager.createTables()
            .catch((err:Error) => {
                fail(err.message);
            })
            .finally(() => {
                db_manager.deleteTables().finally(() => { done(); });
            });
    });
});