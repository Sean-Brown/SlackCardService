/// <reference path="../../typings/index.d.ts" />

import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {CribbageHand} from "../../card_service/implementations/cribbage_hand";
import {CribbageTeam} from "../../card_service/implementations/cribbage_team";
import {
    jackOfHearts, sevenOfDiamonds, sixOfClubs, aceOfSpades, fourOfSpades, kingOfHearts,
    queenOfDiamonds, sevenOfClubs
} from "../StandardCards";

describe("Test the Cribbage Team's functionality", function() {
    var team;
    var playerOne;
    var playerTwo;
    beforeEach(function() {
        playerOne = new CribbagePlayer("Bob", new CribbageHand([
            aceOfSpades,
            sixOfClubs,
            sevenOfDiamonds,
            jackOfHearts
        ]));
        playerTwo = new CribbagePlayer("Steve", new CribbageHand([
            fourOfSpades,
            sevenOfClubs,
            queenOfDiamonds,
            kingOfHearts
        ]));
    	team = new CribbageTeam(1, [playerOne, playerTwo]);
    });
    it("tracks points for the entire team", function() {
        expect(playerOne.points).toEqual(0);
        expect(playerTwo.points).toEqual(0);
        expect(team.countPoints()).toEqual(0);
        team.addPoints(playerOne, 2);
        team.addPoints(playerTwo, 7);
        expect(team.countPoints()).toEqual(9);
    });
    it("knows what players it has", function () {
        expect(team.hasPlayer(playerOne)).toBe(true);
        expect(team.hasPlayer(playerTwo)).toBe(true);
        expect(team.hasPlayer(new CribbagePlayer("Alice", new CribbageHand([])))).toBe(false);
    });
});