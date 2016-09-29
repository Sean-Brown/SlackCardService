/// <reference path="../../typings/index.d.ts" />
/// <reference path="../../card_service/base_classes/items/card.ts" />

import {BaseCard, Suit, Value} from "../../card_service/base_classes/items/card";

describe("Test the BaseCard", function() {
    it("should print its name correctly", function () {
        var card = new BaseCard(Suit.Spades, Value.Ace);
        expect(card.toString()).toEqual("Ace of Spades");
    });
});