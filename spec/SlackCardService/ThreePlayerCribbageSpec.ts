/// <reference path="../../typings/index.d.ts" />
///<reference path="../StandardCards.ts"/>

import {BaseCard, Suit, Value} from "../../card_service/base_classes/items/card";
import {BaseHand} from "../../card_service/base_classes/collections/hand";
import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {Cribbage, CribbageStrings} from "../../card_service/implementations/cribbage";
import {Players, Sequence, removeLastTwoChars} from "../../card_service/base_classes/card_game";
import {CribbageHand} from "../../card_service/implementations/cribbage_hand";
import {ItemCollection} from "../../card_service/base_classes/collections/item_collection";
import Base = Mocha.reporters.Base;
import ErrorStrings = CribbageStrings.ErrorStrings;
import {
    aceOfSpades, queenOfDiamonds, aceOfClubs, threeOfSpades, aceOfHearts, queenOfClubs, tenOfDiamonds,
    fiveOfSpades, aceOfDiamonds, tenOfClubs, fiveOfHearts, twoOfClubs, fourOfClubs, sixOfClubs, eightOfClubs,
    twoOfDiamonds, eightOfSpades, queenOfSpades, queenOfHearts, kingOfHearts, fiveOfClubs, kingOfSpades,
    fiveOfDiamonds, sevenOfSpades, sevenOfDiamonds, eightOfHearts, nineOfHearts, jackOfSpades,
    threeOfHearts, nineOfDiamonds, fourOfSpades, sixOfSpades, sevenOfClubs, jackOfHearts, sixOfHearts,
    sevenOfHearts, fourOfHearts, fourOfDiamonds, sixOfDiamonds
} from "../StandardCards";

"use strict";

describe("Test a Cribbage game between three playerIDs", function() {
	var game, playerOne, playerTwo, playerThree;
    beforeEach(function() {
        playerOne = new CribbagePlayer("Alice", new CribbageHand([]));
        playerTwo = new CribbagePlayer("Bob", new CribbageHand([]));
        playerThree = new CribbagePlayer("Cara", new CribbageHand([]));
        game = new Cribbage(new Players<CribbagePlayer>([playerOne, playerTwo, playerThree]));
        game.initializeGame();
    });
    it("doesn't allow duplicate playerIDs", function() {
       expect(function() { game.addPlayer(playerOne); }).toThrow(ErrorStrings.PLAYER_ALREADY_IN_GAME);
    });
    it("cuts a random dealer", function () {
        var sameDealerEveryTime = true;
        var lastDealer = null;
        for (var ix = 0; ix < 1000; ix++) {
            game.cutForDealer();
            if (lastDealer == null) {
                lastDealer = game.dealer;
            }
            else if (!lastDealer.equalsOther(game.dealer)) {
                sameDealerEveryTime = false;
                break;
            }
        }
        expect(sameDealerEveryTime).toBe(false);
    });
    it("sets the next dealer correctly", function() {
        game.dealer = playerOne;
        game.nextPlayerInSequence = playerTwo;
        game.setNextDealer();
        expect(game.dealer.equalsOther(playerTwo)).toBe(true);
        expect(game.nextPlayerInSequence.equalsOther(playerThree)).toBe(true);
        game.setNextDealer();
        expect(game.dealer.equalsOther(playerThree)).toBe(true);
        expect(game.nextPlayerInSequence.equalsOther(playerOne)).toBe(true);
        game.setNextDealer();
        expect(game.dealer.equalsOther(playerOne)).toBe(true);
        expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
        game.setNextDealer();
        expect(game.dealer.equalsOther(playerTwo)).toBe(true);
        expect(game.nextPlayerInSequence.equalsOther(playerThree)).toBe(true);
    });
    it("sets the next player in the sequence correctly", function() {
        expect(game.nextPlayerInOrder(playerOne).equalsOther(playerTwo)).toBe(true);
        expect(game.nextPlayerInOrder(playerTwo).equalsOther(playerThree)).toBe(true);
        expect(game.nextPlayerInOrder(playerThree).equalsOther(playerOne)).toBe(true);
    });
    it("deals the right number of cards and assigns a dealer", function () {
        expect(game.dealer).toBeNull();
        expect(game.playerIDs.itemAt(0).numCards()).toEqual(0);
        expect(game.playerIDs.itemAt(1).numCards()).toEqual(0);
        expect(game.playerIDs.itemAt(2).numCards()).toEqual(0);
        game.cutForDealer();
        expect(game.dealer).toBeDefined();
        expect(game.nextPlayerInSequence).toBeDefined();
        game.deal();
        expect(game.playerIDs.itemAt(0).numCards()).toEqual(5);
        expect(game.playerIDs.itemAt(1).numCards()).toEqual(5);
        expect(game.playerIDs.itemAt(2).numCards()).toEqual(5);
        expect(game.kitty.countItems()).toEqual(1);
    });
    function copyHand(cards: Array<BaseCard>) {
        var copy = [];
        for (var index = 0; index < cards.length; index++) {
            var card = cards[index];
            copy.push(new BaseCard(card.suit, card.value));
        }
        return new BaseHand(copy);
    }
    function handsAreDistinct(handOne: BaseHand, handTwo: BaseHand) {
        var areDistinct = false;
        for (var h1Ix = 0; h1Ix < handOne.countItems(); h1Ix++) {
            var cardOne = handOne.itemAt(h1Ix);
            var hasMatch = false;
            for (var h2Ix = 0; h2Ix < handTwo.countItems(); h2Ix++) {
                var cardTwo = handTwo.itemAt(h2Ix);
                if (cardOne.equalsOther(cardTwo)) {
                    hasMatch = true;
                    break;
                }
            }
            if (!hasMatch) {
                areDistinct = true;
                break;
            }
        }
        return areDistinct;
    }
    it("deals random cards each time", function () {
        game.cutForDealer();
        game.deal();
        var handOne = copyHand(game.playerIDs.itemAt(0).hand.items);
        var handTwo = copyHand(game.playerIDs.itemAt(1).hand.items);
        game.deal();
        var handOneAgain = copyHand(game.playerIDs.itemAt(0).hand.items);
        var handTwoAgain = copyHand(game.playerIDs.itemAt(1).hand.items);
        expect(handsAreDistinct(handOne, handOneAgain)).toBe(true);
        expect(handsAreDistinct(handTwo, handTwoAgain)).toBe(true);
    });
    it("waits for the kitty to be full before letting playerIDs play", function () {
        expect(function() { game.playCard(playerTwo.name); }).toThrow(ErrorStrings.KITTY_NOT_READY);
    });
    //it("doesn't let a player throw the same card twice", function () {
    //    game.cutForDealer();
    //    game.deal();
    //    // get the first playerIDs first card
    //    var firstPlayer = game.playerIDs.itemAt(0);
    //    var firstCard = playerOne.hand.itemAt(0);
    //    expect(function() { game.giveToKitty(firstPlayer.name, new ItemCollection([firstCard, firstCard])) })
    //        .toThrow(ErrorStrings.DUPLICATE_CARD_THROWN_TO_KITTY);
    //});
    it("removes a player from play if they play their last card", function() {
        playerOne.hand =
            new CribbageHand([aceOfClubs, aceOfDiamonds, aceOfHearts, aceOfSpades, twoOfDiamonds]);
        playerTwo.hand =
            new CribbageHand([queenOfClubs, queenOfHearts, queenOfSpades, kingOfHearts, kingOfSpades]);
        playerThree.hand =
            new CribbageHand([tenOfClubs, tenOfDiamonds, fiveOfClubs, fiveOfDiamonds, sixOfClubs]);
        game.dealer = playerOne;
        game.nextPlayerInSequence = playerTwo;
        game.giveToKitty(playerOne.name, new ItemCollection<BaseCard>([twoOfDiamonds]));
        game.giveToKitty(playerTwo.name, new ItemCollection<BaseCard>([queenOfClubs]));
        game.giveToKitty(playerThree.name, new ItemCollection<BaseCard>([tenOfClubs]));
        game.kitty.takeCard(fourOfClubs);
        game.cut = new BaseCard(Suit.Spades, Value.King);
        game.playersInPlay.addItems(game.playerIDs.items);
        game.playCard(playerTwo.name, queenOfHearts);
        game.playCard(playerThree.name, fiveOfClubs);
        game.playCard(playerOne.name, aceOfClubs);
        game.playCard(playerTwo.name, queenOfSpades);
        game.playCard(playerThree.name, fiveOfDiamonds);
        // 2nd round
        game.playCard(playerOne.name, aceOfSpades);
        game.playCard(playerTwo.name, kingOfHearts);
        game.playCard(playerThree.name, sixOfClubs);
        game.playCard(playerOne.name, aceOfDiamonds);
        game.playCard(playerTwo.name, kingOfSpades);
        game.go(playerThree.name);
        game.playCard(playerOne.name, aceOfHearts);
        expect(game.playersInPlay.countItems()).toEqual(1);
        expect(game.playersInPlay.indexOfItem(playerThree)).toBe(0); // nobody should be left
        expect(game.count).toEqual(0); // expect the game to have reset the sequence
    });
    describe("Test with fixed hands, starting at 0 points", function() {
        beforeEach(function () {
            playerOne.hand =
                new CribbageHand([sevenOfSpades, sevenOfDiamonds, eightOfHearts, eightOfSpades, tenOfClubs]);
            playerTwo.hand =
                new CribbageHand([nineOfHearts, tenOfDiamonds, jackOfSpades, queenOfHearts, kingOfHearts]);
            playerThree.hand =
                new CribbageHand([aceOfClubs, aceOfDiamonds, twoOfClubs, twoOfDiamonds, threeOfHearts]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.giveToKitty(playerOne.name, new ItemCollection<BaseCard>([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new ItemCollection<BaseCard>([kingOfHearts]));
            game.giveToKitty(playerThree.name, new ItemCollection<BaseCard>([threeOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.cut = kingOfSpades;
            game.playersInPlay.addItems(game.playerIDs.items);
        });
        it("takes cards from the playerIDs hands when they give to the kitty", function () {
            expect(playerOne.hand.size()).toEqual(4);
            expect(playerTwo.hand.size()).toEqual(4);
            expect(playerThree.hand.size()).toEqual(4);
            expect(game.kitty.size()).toEqual(4);
        });
        it("doesn't let a player play a card they don't have", function () {
            expect(function() { game.playCard(playerTwo.name, tenOfClubs); }).toThrow(`${ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD} the ${tenOfClubs.toString()}!`);
        });
        it("ensures playerIDs play in order", function () {
            expect(function() { game.playCard(playerOne.name, sevenOfSpades); }).toThrow(ErrorStrings.FMT_NOT_NEXT_PLAYER + playerTwo.name);
        });
        it("knows how to count points in round 2", function () {
            expect(playerOne.countPoints(game.cut)).toEqual(12);
            expect(playerTwo.countPoints(game.cut)).toEqual(6);
            expect(playerThree.countPoints(game.cut)).toEqual(8);
            expect(game.kitty.countPoints(game.cut, true)).toEqual(2);
        });
        describe("Test playing cards", function () {
            beforeEach(function () {
                game.playCard(playerTwo.name, queenOfHearts);
                game.playCard(playerThree.name, twoOfClubs);
                game.playCard(playerOne.name, eightOfSpades);
                game.playCard(playerTwo.name, tenOfDiamonds);
            });
            it("does not allow exceeding 31", function () {
                expect(function () { game.playCard(playerThree.name, twoOfDiamonds); }).toThrow(ErrorStrings.EXCEEDS_31);
            });
            it("adds to the sequence", function () {
                expect(game.sequence.cards.countItems()).toEqual(4);
            });
            it("knows when the game is over", function () {
                game.teams.findTeam(playerOne).addPoints(playerOne, 119);
                expect(playerOne.hand.takeCard(new BaseCard(Suit.Spades, Value.Ace))).toBe(true);
            });
        });
    });
    describe("Test an entire round of play", function () {
        beforeEach(function () {
        });
        it("knows how to play one round", function () {
            playerOne.hand =
                new CribbageHand([sevenOfSpades, sevenOfDiamonds, eightOfHearts, eightOfSpades, tenOfClubs]);
            playerTwo.hand =
                new CribbageHand([nineOfHearts, tenOfDiamonds, jackOfSpades, queenOfHearts, kingOfHearts]);
            playerThree.hand =
                new CribbageHand([aceOfDiamonds, twoOfClubs, twoOfDiamonds, threeOfHearts, fiveOfSpades]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.giveToKitty(playerOne.name, new ItemCollection([sevenOfDiamonds]));
            game.giveToKitty(playerTwo.name, new ItemCollection([kingOfHearts]));
            game.giveToKitty(playerThree.name, new ItemCollection([threeOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.cut = new BaseCard(Suit.Spades, Value.King);
            game.playersInPlay.addItems(game.playerIDs.items);
            game.playCard(playerTwo.name, nineOfHearts);
            game.playCard(playerThree.name, twoOfDiamonds);
            game.playCard(playerOne.name, eightOfHearts);
            game.playCard(playerTwo.name, jackOfSpades);
            game.playCard(playerThree.name, twoOfClubs);
            expect(game.getTeam(2).countPoints()).toEqual(2);
            expect(game.nextPlayerInSequence.equalsOther(playerOne)).toBe(true);
            game.playCard(playerOne.name, tenOfClubs);
            game.playCard(playerTwo.name, tenOfDiamonds);
            expect(game.getTeam(1).countPoints()).toEqual(2);
            game.playCard(playerThree.name, aceOfDiamonds);
            game.playCard(playerOne.name, eightOfSpades);
            game.go(playerTwo.name);
            game.go(playerThree.name);
            game.go(playerOne.name);
            expect(game.getTeam(0).countPoints()).toEqual(1);
            expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
            game.playCard(playerTwo.name, queenOfHearts);
            game.playCard(playerThree.name, fiveOfSpades);
            expect(game.getTeam(2).countPoints()).toEqual(4);
            game.playCard(playerOne.name, sevenOfSpades);
            expect(game.getTeam(0).countPoints()).toEqual(2 + 4 + 2 + 2); // Pairs + 15s + run of play + kitty
            expect(game.getTeam(1).countPoints()).toEqual(5 + 1 + 2); // Run + RightJack + Run of play
            expect(game.getTeam(2).countPoints()).toEqual(2 + 4 + 4); // Pairs + 15s + Run of play
            expect(game.dealer.equalsOther(playerTwo)).toBe(true);
        });
        it("knows how to play one round", function () {
            playerOne.hand =
                new CribbageHand([tenOfClubs, jackOfSpades, twoOfDiamonds, nineOfDiamonds, queenOfDiamonds]);
            playerTwo.hand =
                new CribbageHand([tenOfDiamonds, fourOfSpades, sixOfSpades, sevenOfClubs, jackOfHearts]);
            playerThree.hand =
                new CribbageHand([fiveOfSpades, queenOfClubs, twoOfClubs, twoOfDiamonds, threeOfHearts]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.giveToKitty(playerOne.name, new ItemCollection([nineOfDiamonds]));
            game.giveToKitty(playerTwo.name, new ItemCollection([jackOfHearts]));
            game.giveToKitty(playerThree.name, new ItemCollection([threeOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.cut = new BaseCard(Suit.Spades, Value.Two);
            game.playersInPlay.addItems(game.playerIDs.items);
            game.playCard(playerTwo.name, tenOfDiamonds);
            game.playCard(playerThree.name, queenOfClubs);
            game.playCard(playerOne.name, queenOfDiamonds);
            game.go(playerTwo.name);
            game.go(playerThree.name);
            spyOn(game, "roundOverResetState");
            game.go(playerOne.name);
            expect(game.roundOverResetState).not.toHaveBeenCalled();
        });
    });
    describe("Test player playing cards after other player says 'go'", function () {
        beforeEach(function () {
            playerOne.hand =
                new CribbageHand([aceOfClubs, twoOfDiamonds, sixOfClubs, eightOfClubs, tenOfClubs]);
            playerTwo.hand =
                new CribbageHand([threeOfSpades, fiveOfHearts, eightOfSpades, queenOfSpades, kingOfSpades]);
            playerThree.hand =
                new CribbageHand([fiveOfSpades, queenOfDiamonds, twoOfClubs, sevenOfClubs, kingOfHearts]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.cut = queenOfClubs;
            game.playersInPlay.addItems(game.playerIDs.items);
        });
        it("sets the next player correctly", function () {
            game.giveToKitty(playerOne.name, new ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new ItemCollection([kingOfSpades]));
            game.giveToKitty(playerThree.name, new ItemCollection([kingOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.playCard(playerTwo.name, threeOfSpades);
            game.playCard(playerThree.name, twoOfClubs);
            game.playCard(playerOne.name, eightOfClubs);
            game.playCard(playerTwo.name, queenOfSpades);
            game.playCard(playerThree.name, fiveOfSpades);
            game.playCard(playerOne.name, twoOfDiamonds);
            game.go(playerTwo.name);
            game.go(playerThree.name);
            expect(function () { game.playCard(playerOne.name, aceOfClubs); })
                .not
                .toThrow(ErrorStrings.FMT_NOT_NEXT_PLAYER + " + " + game.nextPlayerInSequence.name);
        });
        it("gives the correct player the point", function () {
            game.dealer = playerThree;
            game.nextPlayerInSequence = playerOne;
            game.giveToKitty(playerOne.name, new ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new ItemCollection([kingOfSpades]));
            game.giveToKitty(playerThree.name, new ItemCollection([kingOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.playCard(playerOne.name, aceOfClubs);
            game.playCard(playerTwo.name, eightOfSpades);
            game.playCard(playerThree.name, twoOfClubs);
            game.playCard(playerOne.name, eightOfClubs);
            game.playCard(playerTwo.name, fiveOfHearts);
            game.playCard(playerThree.name, fiveOfSpades);
            game.playCard(playerOne.name, twoOfDiamonds);
            // round 2
            game.playCard(playerTwo.name, queenOfSpades);
            game.playCard(playerThree.name, queenOfDiamonds);
            game.playCard(playerOne.name, sixOfClubs);
            game.playCard(playerTwo.name, threeOfSpades);
            game.go(playerThree.name);
            expect(game.getTeam(1).countPoints()).toEqual(1);
        });
        it("sets the next player correctly when a player gets a go and has no more cards but the opponent does", function () {
            game.dealer = playerThree;
            game.nextPlayerInSequence = playerOne;
            game.giveToKitty(playerOne.name, new ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new ItemCollection([fiveOfHearts]));
            game.giveToKitty(playerThree.name, new ItemCollection([twoOfClubs]));
            game.kitty.takeCard(fourOfClubs);
            playerOne.hand.removeItem(sixOfClubs);
            playerOne.hand.removeItem(eightOfClubs);
            playerOne.hand.addItems([aceOfDiamonds, aceOfSpades]);
            game.playCard(playerOne.name, twoOfDiamonds);
            game.playCard(playerTwo.name, eightOfSpades);
            game.playCard(playerThree.name, queenOfDiamonds);
            game.playCard(playerOne.name, aceOfClubs);
            game.playCard(playerTwo.name, threeOfSpades);
            game.playCard(playerThree.name, fiveOfSpades);
            game.playCard(playerOne.name, aceOfDiamonds);
            game.go(playerTwo.name);
            game.go(playerThree.name);
            game.playCard(playerOne.name, aceOfSpades);
            expect(game.count).toEqual(0); // The round should restart because there will be no playerIDs left in play
            expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
        });
        it("sets the next player correctly after one scores 31", function() {
            game.dealer = playerThree;
            game.nextPlayerInSequence = playerOne;
            game.giveToKitty(playerOne.name, new ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new ItemCollection([fiveOfHearts]));
            game.giveToKitty(playerThree.name, new ItemCollection([twoOfClubs]));
            game.kitty.takeCard(fourOfClubs);
            playerOne.hand.removeItem(sixOfClubs);
            playerOne.hand.removeItem(eightOfClubs);
            playerOne.hand.addItems([aceOfDiamonds, aceOfSpades]);
            game.playCard(playerOne.name, twoOfDiamonds);
            game.playCard(playerTwo.name, eightOfSpades);
            game.playCard(playerThree.name, queenOfDiamonds);
            game.playCard(playerOne.name, aceOfClubs);
            game.playCard(playerTwo.name, threeOfSpades);
            game.playCard(playerThree.name, fiveOfSpades);
            game.playCard(playerOne.name, aceOfDiamonds);
            game.go(playerTwo.name);
            game.go(playerThree.name);
            game.playCard(playerOne.name, aceOfSpades);
            expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
        });
        it("sets the next player correctly after a go", function() {
            game.dealer = playerThree;
            game.nextPlayerInSequence = playerOne;
            game.giveToKitty(playerOne.name, new ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new ItemCollection([fiveOfHearts]));
            game.giveToKitty(playerThree.name, new ItemCollection([twoOfClubs]));
            game.kitty.takeCard(fourOfClubs);
            playerOne.hand.removeItem(sixOfClubs);
            playerOne.hand.removeItem(eightOfClubs);
            playerOne.hand.addItems([aceOfDiamonds, aceOfSpades]);
            game.playCard(playerOne.name, twoOfDiamonds);
            game.playCard(playerTwo.name, eightOfSpades);
            game.playCard(playerThree.name, queenOfDiamonds);
            game.playCard(playerOne.name, aceOfClubs);
            game.playCard(playerTwo.name, threeOfSpades);
            game.playCard(playerThree.name, fiveOfSpades);
            game.playCard(playerOne.name, aceOfDiamonds);
            game.go(playerTwo.name);
            expect(game.nextPlayerInSequence.equalsOther(playerThree)).toBe(true);
            game.go(playerThree.name);
            game.playCard(playerOne.name, aceOfSpades);
            game.playCard(playerTwo.name, queenOfSpades);
            game.playCard(playerThree.name, kingOfHearts);
            // Player one is out of cards and player one has one card left, expect them to be the next player to play
            expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
        });
    });
    describe("Test the run-of-play", function() {
        class SeqVal {
            sequence: Sequence;
            expectedValue: number;
            constructor(sequence: Sequence, expectedValue: number) {
                this.sequence = sequence;
                this.expectedValue = expectedValue;
            }
            toString() {
                var text = '';
                for (var index = 0; index < this.sequence.cards.countItems(); index++) {
                    text += this.sequence.cards.itemAt(index).toString() + ', ';
                }
                if (text.length > 0) {
                    // Remove the last comma + space
                    text = removeLastTwoChars(text);
                }
                return text;
            }
            countPoints() {
                return this.sequence.countPoints();
            }
            static makeSequence(cards: Array<BaseCard>): Sequence {
                var seq = new Sequence();
                seq.addCards(cards);
                return seq;
            }
            static getAllPermutations(sequence: Sequence): Array<Sequence> {
                var permutations:Array<Array<BaseCard>> = [];
                function permute(input: Array<BaseCard>, memo?: any) {
                    var cur, memo = memo || [];
                    for (var i = 0; i < input.length; i++) {
                        cur = input.splice(i, 1);
                        if (input.length == 0) {
                            permutations.push(memo.concat(cur));
                        }
                        permute(input.slice(), memo.concat(cur));
                        input.splice(i, 0, cur[0]);
                    }
                    return permutations;
                }
                permute(sequence.cards.items);
                var ret = [];
                for (var ix = 0; ix < permutations.length; ix++) {
                    var newSeq = new Sequence();
                    newSeq.addCards(permutations[ix]);
                    ret.push(newSeq);
                }
                return ret;
            }
        }
        describe("Test counting points in the run-of-play", function () {
            describe("knows how to count runs", function () {
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([sixOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(3);
                });
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([jackOfSpades, sixOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(3);
                });
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([fourOfClubs, jackOfSpades, sixOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(3);
                });
                it("is a run of zero", function () {
                    expect(SeqVal.makeSequence([fourOfClubs, sixOfHearts, jackOfSpades, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(0);
                });
                it("is a run of four", function () {
                    expect(SeqVal.makeSequence([sixOfHearts, eightOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(4);
                });
                it("is a run of four", function () {
                    expect(SeqVal.makeSequence([jackOfSpades, sixOfHearts, eightOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(4);
                });
                it("is a run of four", function () {
                    expect(SeqVal.makeSequence([fourOfHearts, jackOfSpades, sixOfHearts, eightOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(4);
                });
                it("is a run of four", function () {
                    expect(SeqVal.makeSequence([fourOfHearts, fourOfSpades, jackOfSpades, sixOfHearts, eightOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(4);
                });
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([fourOfHearts, fourOfSpades, eightOfHearts, jackOfSpades, sixOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(3);
                });
                it("is a run of zero", function () {
                    expect(SeqVal.makeSequence([fourOfHearts, fourOfSpades, sixOfHearts, eightOfHearts, jackOfSpades, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(0);
                });
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([fourOfHearts, fourOfSpades, eightOfHearts, jackOfSpades, sixOfHearts, fiveOfHearts, sevenOfHearts]).countPoints()).toEqual(3);
                });
                it("is a run of five", function () {
                    expect(SeqVal.makeSequence([fiveOfHearts, sevenOfHearts, fourOfHearts, sixOfHearts, eightOfHearts]).countPoints()).toEqual(5);
                });
                it("is a run of five", function () {
                    expect(SeqVal.makeSequence([jackOfSpades, fiveOfHearts, sevenOfHearts, fourOfHearts, sixOfHearts, eightOfHearts]).countPoints()).toEqual(5);
                });
                it("is a run of five", function () {
                    expect(SeqVal.makeSequence([fourOfClubs, jackOfSpades, fiveOfHearts, sevenOfHearts, fourOfHearts, sixOfHearts, eightOfHearts]).countPoints()).toEqual(5);
                });
                it("is a run of five", function () {
                    expect(SeqVal.makeSequence([fourOfDiamonds, fourOfClubs, jackOfSpades, fiveOfHearts, sevenOfHearts, fourOfHearts, sixOfHearts, eightOfHearts]).countPoints()).toEqual(5);
                });
                it("is a run of four", function () {
                    expect(SeqVal.makeSequence([fourOfDiamonds, fourOfClubs, eightOfHearts, jackOfSpades, sevenOfHearts, fiveOfHearts, fourOfHearts, sixOfHearts]).countPoints()).toEqual(4);
                });
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([fourOfDiamonds, fourOfClubs, eightOfHearts, sevenOfHearts, jackOfSpades, fiveOfHearts, fourOfHearts, sixOfHearts]).countPoints()).toEqual(3);
                });
                it("is a run of zero", function () {
                    expect(SeqVal.makeSequence([fourOfDiamonds, fourOfClubs, fiveOfHearts, sevenOfHearts, jackOfSpades, fourOfHearts, sixOfHearts, eightOfHearts]).countPoints()).toEqual(0);
                });
                it("is a run of three", function () {
                    expect(SeqVal.makeSequence([sixOfHearts, fourOfClubs, eightOfHearts, sevenOfClubs, sixOfDiamonds]).countPoints()).toEqual(3);
                });
                it("is a run of three, twice!", function () {
                    expect(SeqVal.makeSequence([sevenOfSpades, fiveOfHearts, sixOfDiamonds]).countPoints()).toEqual(3);
                    expect(SeqVal.makeSequence([sevenOfSpades, fiveOfHearts, sixOfDiamonds, fiveOfSpades, sevenOfHearts]).countPoints()).toEqual(3);
                });
            });
            it("knows how to count of-a-kinds", function () {
                var pair = new SeqVal(SeqVal.makeSequence([sevenOfSpades, sevenOfHearts]), 2);
                var threeOfAKind = new SeqVal(SeqVal.makeSequence([sevenOfSpades, sevenOfHearts, sevenOfClubs]), 6);
                var fourOfAKind = new SeqVal(SeqVal.makeSequence([sevenOfSpades, sevenOfHearts, sevenOfClubs, sevenOfDiamonds]), 12);
                expect(pair.countPoints()).toEqual(pair.expectedValue);
                expect(threeOfAKind.countPoints()).toEqual(threeOfAKind.expectedValue);
                expect(fourOfAKind.countPoints()).toEqual(fourOfAKind.expectedValue);
            });
        });
    });
});