import {CribbageRoutes} from "../../../routes/Cribbage/index";
import Router = CribbageRoutes.Router;
import {BaseCard as Card, Value} from "../../../card_service/base_classes/items/card";

describe("Test the cribbage routes 'index' class", function() {
    var router:Router;
    beforeEach(() => {
        router = new Router();
    });
});