/// <reference path="../../typings/index.d.ts" />

import {BaseHand} from "../../card_service/base_classes/collections/hand";
import {BasePlayer} from "../../card_service/base_classes/items/player";
import {aceOfSpades, tenOfHearts, queenOfDiamonds, kingOfClubs} from "../StandardCards";

describe("Test the Base Player's functionality", function() {
	var player;
    beforeEach(function() {
    	player = new BasePlayer("Bob", new BaseHand([
            aceOfSpades,
            tenOfHearts,
            queenOfDiamonds,
            kingOfClubs
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