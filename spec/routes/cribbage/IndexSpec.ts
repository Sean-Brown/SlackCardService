import {CribbageRoutes} from "../../../routes/Cribbage/index";
import Router = CribbageRoutes.Router;
import {deleteTables} from "../../db/postgres/integration/CreateTablesSpec";

describe("Test the cribbage routes 'index' class", function() {
    var router:Router;
    beforeEach((done) => {
        // Create the database
        router = new Router();
        router.init()
            .then(() => {
                // Mock the request and response objects
            })
            .finally(() => { done(); });
    });
    afterEach((done) => {
        // Destroy the database
        deleteTables().finally(() => { done(); });
    })
});