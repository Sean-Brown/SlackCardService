/// <reference path="../../typings/main/ambient/jasmine/jasmine.d.ts" />
/// <reference path="../../card_service/base_classes/collections/hand.ts" />
/// <reference path="../../card_service/base_classes/items/card.ts" />
/// <reference path="../../card_service/base_classes/items/player.ts" />

import {BaseHand} from "../../card_service/base_classes/collections/hand";
import {BaseCard, Suit, Value} from "../../card_service/base_classes/items/card";
import {BasePlayer} from "../../card_service/base_classes/items/player";

describe("Test the Base Player's functionality", function() {
	var player;
    beforeEach(function() {
    	player = new BasePlayer("Bob", new BaseHand([
            new BaseCard(Suit.Spades, Value.Ace),
            new BaseCard(Suit.Hearts, Value.Ten),
            new BaseCard(Suit.Diamonds, Value.Queen),
            new BaseCard(Suit.Clubs, Value.King)
        ]));
    });
    it("equals another player with the same name", function () {
        var other = new BasePlayer("Bob", new BaseHand([]));
        expect(player.equalsOther(other)).toBe(true);
    });
    it("is not equal to another player with a different name", function () {
        var other = new BasePlayer("Bob Pfeffer", new BaseHand([]));
        expect(player.equalsOther(other)).toBe(false);
    });
});