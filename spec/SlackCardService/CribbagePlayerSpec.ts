/// <reference path="../../typings/main/ambient/jasmine/jasmine.d.ts" />
/// <reference path="../../card_service/implementations/cribbage_hand.ts" />
/// <reference path="../../card_service/implementations/cribbage_player.ts" />

import {BaseCard, Suit, Value} from "../../card_service/base_classes/items/card";
import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {CribbageHand} from "../../card_service/implementations/cribbage_hand";

describe("Test the Cribbage Player's functionality", function() {
    var player;
    var duplicateCard;
	beforeEach(function() {
        duplicateCard = new BaseCard(Suit.Spades, Value.Ace);
		player = new CribbagePlayer("Bob", new CribbageHand([
            duplicateCard,
            new BaseCard(Suit.Clubs, Value.Four),
            new BaseCard(Suit.Diamonds, Value.Jack),
            new BaseCard(Suit.Hearts, Value.King)
        ]));
	});
    it("tracks the cards it has played", function () {
        expect(player.playCard(duplicateCard)).toBe(true);
        expect(player.played.countItems()).toEqual(1);
        expect(player.played.items[0].equalsOther(duplicateCard)).toBe(true);
    });
    it("can reset its hand", function () {
        expect(player.hand.countItems()).toEqual(4);
        expect(player.playCard(duplicateCard)).toBe(true);
        expect(player.played.countItems()).toEqual(1);
        player.resetCards();
        expect(player.hand.countItems()).toEqual(0);
        expect(player.played.countItems()).toEqual(0);
    });
});