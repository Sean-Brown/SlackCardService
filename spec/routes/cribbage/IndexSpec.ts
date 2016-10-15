import {CribbageRoutes} from "../../../routes/Cribbage/index";
import Router = CribbageRoutes.Router;
import {BaseCard as Card, Value} from "../../../card_service/base_classes/items/card";

describe("Test the cribbage routes 'index' class", function() {
    var router:Router;
    beforeEach(() => {
        router = new Router();
    });
    it("allows a ten to be entered as '10' or 't'", function(done) {
        var cards = Router.parseCards("10s tc");
        expect(cards.length).toEqual(2);
        expect(cards[0].value).toEqual(Value.Ten);
        expect(cards[1].value).toEqual(Value.Ten);
    });
});