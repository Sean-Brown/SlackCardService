var card_1 = require("../../card_service/base_classes/items/card");
var hand_1 = require("../../card_service/base_classes/collections/hand");
var cribbage_player_1 = require("../../card_service/implementations/cribbage_player");
var cribbage_1 = require("../../card_service/implementations/cribbage");
var card_game_1 = require("../../card_service/base_classes/card_game");
var cribbage_hand_1 = require("../../card_service/implementations/cribbage_hand");
var item_collection_1 = require("../../card_service/base_classes/collections/item_collection");
var ErrorStrings = cribbage_1.CribbageStrings.ErrorStrings;
"use strict";
describe("Test a Cribbage game between three players", function () {
    var game, playerOne, playerTwo, playerThree;
    var aceOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Ace), aceOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Ace), aceOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Ace), aceOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Ace), twoOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Two), twoOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Two), threeOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Three), threeOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Three), threeOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Three), fourOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Four), fourOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Four), fourOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Four), fourOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Four), fiveOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Five), fiveOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Five), fiveOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Five), fiveOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Five), sixOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Six), sixOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Six), sixOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Six), sixOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Six), sevenOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Seven), sevenOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Seven), sevenOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Seven), sevenOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Seven), eightOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Eight), eightOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Eight), eightOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Eight), eightOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Eight), nineOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Nine), nineOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Nine), tenOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Ten), tenOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Ten), jackOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Jack), jackOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Jack), queenOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Queen), queenOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Queen), queenOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Queen), queenOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Queen), kingOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.King), kingOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.King), kingOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.King);
    beforeEach(function () {
        playerOne = new cribbage_player_1.CribbagePlayer("Alice", new cribbage_hand_1.CribbageHand([]));
        playerTwo = new cribbage_player_1.CribbagePlayer("Bob", new cribbage_hand_1.CribbageHand([]));
        playerThree = new cribbage_player_1.CribbagePlayer("Cara", new cribbage_hand_1.CribbageHand([]));
        game = new cribbage_1.Cribbage(new card_game_1.Players([playerOne, playerTwo, playerThree]));
        game.initializeGame();
    });
    it("doesn't allow duplicate players", function () {
        expect(function () { game.addPlayer(playerOne); }).toThrow(ErrorStrings.PLAYER_ALREADY_IN_GAME);
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
    it("sets the next dealer correctly", function () {
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
    it("sets the next player in the sequence correctly", function () {
        expect(game.nextPlayerInOrder(playerOne).equalsOther(playerTwo)).toBe(true);
        expect(game.nextPlayerInOrder(playerTwo).equalsOther(playerThree)).toBe(true);
        expect(game.nextPlayerInOrder(playerThree).equalsOther(playerOne)).toBe(true);
    });
    it("deals the right number of cards and assigns a dealer", function () {
        expect(game.dealer).toBeNull();
        expect(game.players.itemAt(0).numCards()).toEqual(0);
        expect(game.players.itemAt(1).numCards()).toEqual(0);
        expect(game.players.itemAt(2).numCards()).toEqual(0);
        game.cutForDealer();
        expect(game.dealer).toBeDefined();
        expect(game.nextPlayerInSequence).toBeDefined();
        game.deal();
        expect(game.players.itemAt(0).numCards()).toEqual(5);
        expect(game.players.itemAt(1).numCards()).toEqual(5);
        expect(game.players.itemAt(2).numCards()).toEqual(5);
        expect(game.kitty.countItems()).toEqual(1);
    });
    function copyHand(cards) {
        var copy = [];
        for (var index = 0; index < cards.length; index++) {
            var card = cards[index];
            copy.push(new card_1.BaseCard(card.suit, card.value));
        }
        return new hand_1.BaseHand(copy);
    }
    function handsAreDistinct(handOne, handTwo) {
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
        var handOne = copyHand(game.players.itemAt(0).hand.items);
        var handTwo = copyHand(game.players.itemAt(1).hand.items);
        game.deal();
        var handOneAgain = copyHand(game.players.itemAt(0).hand.items);
        var handTwoAgain = copyHand(game.players.itemAt(1).hand.items);
        expect(handsAreDistinct(handOne, handOneAgain)).toBe(true);
        expect(handsAreDistinct(handTwo, handTwoAgain)).toBe(true);
    });
    it("waits for the kitty to be full before letting players play", function () {
        expect(function () { game.playCard(playerTwo.name); }).toThrow(ErrorStrings.KITTY_NOT_READY);
    });
    it("removes a player from play if they play their last card", function () {
        playerOne.hand =
            new cribbage_hand_1.CribbageHand([aceOfClubs, aceOfDiamonds, aceOfHearts, aceOfSpades, twoOfDiamonds]);
        playerTwo.hand =
            new cribbage_hand_1.CribbageHand([queenOfClubs, queenOfHearts, queenOfSpades, kingOfHearts, kingOfSpades]);
        playerThree.hand =
            new cribbage_hand_1.CribbageHand([tenOfClubs, tenOfDiamonds, fiveOfClubs, fiveOfDiamonds, sixOfClubs]);
        game.dealer = playerOne;
        game.nextPlayerInSequence = playerTwo;
        game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([twoOfDiamonds]));
        game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([queenOfClubs]));
        game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([tenOfClubs]));
        game.kitty.takeCard(fourOfClubs);
        game.cut = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.King);
        game.playersInPlay.addItems(game.players.items);
        game.playCard(playerTwo.name, queenOfHearts);
        game.playCard(playerThree.name, fiveOfClubs);
        game.playCard(playerOne.name, aceOfClubs);
        game.playCard(playerTwo.name, queenOfSpades);
        game.playCard(playerThree.name, fiveOfDiamonds);
        game.playCard(playerOne.name, aceOfSpades);
        game.playCard(playerTwo.name, kingOfHearts);
        game.playCard(playerThree.name, sixOfClubs);
        game.playCard(playerOne.name, aceOfDiamonds);
        game.playCard(playerTwo.name, kingOfSpades);
        game.go(playerThree.name);
        game.playCard(playerOne.name, aceOfHearts);
        expect(game.playersInPlay.countItems()).toEqual(1);
        expect(game.playersInPlay.indexOfItem(playerThree)).toBe(0);
        expect(game.count).toEqual(0);
    });
    describe("Test with fixed hands, starting at 0 points", function () {
        beforeEach(function () {
            playerOne.hand =
                new cribbage_hand_1.CribbageHand([sevenOfSpades, sevenOfDiamonds, eightOfHearts, eightOfSpades, tenOfClubs]);
            playerTwo.hand =
                new cribbage_hand_1.CribbageHand([nineOfHearts, tenOfDiamonds, jackOfSpades, queenOfHearts, kingOfHearts]);
            playerThree.hand =
                new cribbage_hand_1.CribbageHand([aceOfClubs, aceOfDiamonds, twoOfClubs, twoOfDiamonds, threeOfHearts]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([kingOfHearts]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([threeOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.cut = kingOfSpades;
            game.playersInPlay.addItems(game.players.items);
        });
        it("takes cards from the players hands when they give to the kitty", function () {
            expect(playerOne.hand.size()).toEqual(4);
            expect(playerTwo.hand.size()).toEqual(4);
            expect(playerThree.hand.size()).toEqual(4);
            expect(game.kitty.size()).toEqual(4);
        });
        it("doesn't let a player play a card they don't have", function () {
            expect(function () { game.playCard(playerTwo.name, tenOfClubs); }).toThrow(ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD + " the " + tenOfClubs.toString() + "!");
        });
        it("ensures players play in order", function () {
            expect(function () { game.playCard(playerOne.name, sevenOfSpades); }).toThrow(ErrorStrings.FMT_NOT_NEXT_PLAYER + playerTwo.name);
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
                expect(playerOne.hand.takeCard(new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Ace))).toBe(true);
            });
        });
    });
    describe("Test an entire round of play", function () {
        beforeEach(function () {
        });
        it("knows how to play one round", function () {
            playerOne.hand =
                new cribbage_hand_1.CribbageHand([sevenOfSpades, sevenOfDiamonds, eightOfHearts, eightOfSpades, tenOfClubs]);
            playerTwo.hand =
                new cribbage_hand_1.CribbageHand([nineOfHearts, tenOfDiamonds, jackOfSpades, queenOfHearts, kingOfHearts]);
            playerThree.hand =
                new cribbage_hand_1.CribbageHand([aceOfDiamonds, twoOfClubs, twoOfDiamonds, threeOfHearts, fiveOfSpades]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([sevenOfDiamonds]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([kingOfHearts]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([threeOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.cut = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.King);
            game.playersInPlay.addItems(game.players.items);
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
            expect(game.getTeam(0).countPoints()).toEqual(2 + 4 + 2 + 2);
            expect(game.getTeam(1).countPoints()).toEqual(5 + 1 + 2);
            expect(game.getTeam(2).countPoints()).toEqual(2 + 4 + 4);
            expect(game.dealer.equalsOther(playerTwo)).toBe(true);
        });
        it("knows how to play one round", function () {
            playerOne.hand =
                new cribbage_hand_1.CribbageHand([tenOfClubs, jackOfSpades, twoOfDiamonds, nineOfDiamonds, queenOfDiamonds]);
            playerTwo.hand =
                new cribbage_hand_1.CribbageHand([tenOfDiamonds, fourOfSpades, sixOfSpades, sevenOfClubs, jackOfHearts]);
            playerThree.hand =
                new cribbage_hand_1.CribbageHand([fiveOfSpades, queenOfClubs, twoOfClubs, twoOfDiamonds, threeOfHearts]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([nineOfDiamonds]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([jackOfHearts]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([threeOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.cut = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Two);
            game.playersInPlay.addItems(game.players.items);
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
                new cribbage_hand_1.CribbageHand([aceOfClubs, twoOfDiamonds, sixOfClubs, eightOfClubs, tenOfClubs]);
            playerTwo.hand =
                new cribbage_hand_1.CribbageHand([threeOfSpades, fiveOfHearts, eightOfSpades, queenOfSpades, kingOfSpades]);
            playerThree.hand =
                new cribbage_hand_1.CribbageHand([fiveOfSpades, queenOfDiamonds, twoOfClubs, sevenOfClubs, kingOfHearts]);
            game.dealer = playerOne;
            game.nextPlayerInSequence = playerTwo;
            game.cut = queenOfClubs;
            game.playersInPlay.addItems(game.players.items);
        });
        it("sets the next player correctly", function () {
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([kingOfSpades]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([kingOfHearts]));
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
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([kingOfSpades]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([kingOfHearts]));
            game.kitty.takeCard(fourOfClubs);
            game.playCard(playerOne.name, aceOfClubs);
            game.playCard(playerTwo.name, eightOfSpades);
            game.playCard(playerThree.name, twoOfClubs);
            game.playCard(playerOne.name, eightOfClubs);
            game.playCard(playerTwo.name, fiveOfHearts);
            game.playCard(playerThree.name, fiveOfSpades);
            game.playCard(playerOne.name, twoOfDiamonds);
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
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([fiveOfHearts]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([twoOfClubs]));
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
            expect(game.count).toEqual(0);
            expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
        });
        it("sets the next player correctly after one scores 31", function () {
            game.dealer = playerThree;
            game.nextPlayerInSequence = playerOne;
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([fiveOfHearts]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([twoOfClubs]));
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
        it("sets the next player correctly after a go", function () {
            game.dealer = playerThree;
            game.nextPlayerInSequence = playerOne;
            game.giveToKitty(playerOne.name, new item_collection_1.ItemCollection([tenOfClubs]));
            game.giveToKitty(playerTwo.name, new item_collection_1.ItemCollection([fiveOfHearts]));
            game.giveToKitty(playerThree.name, new item_collection_1.ItemCollection([twoOfClubs]));
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
            expect(game.nextPlayerInSequence.equalsOther(playerTwo)).toBe(true);
        });
    });
    describe("Test the run-of-play", function () {
        var SeqVal = (function () {
            function SeqVal(sequence, expectedValue) {
                this.sequence = sequence;
                this.expectedValue = expectedValue;
            }
            SeqVal.prototype.toString = function () {
                var text = '';
                for (var index = 0; index < this.sequence.cards.countItems(); index++) {
                    text += this.sequence.cards.itemAt(index).toString() + ', ';
                }
                if (text.length > 0) {
                    text = card_game_1.removeLastTwoChars(text);
                }
                return text;
            };
            SeqVal.prototype.countPoints = function () {
                return this.sequence.countPoints();
            };
            SeqVal.makeSequence = function (cards) {
                var seq = new card_game_1.Sequence();
                seq.addCards(cards);
                return seq;
            };
            SeqVal.getAllPermutations = function (sequence) {
                var permutations = [];
                function permute(input, memo) {
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
                    var newSeq = new card_game_1.Sequence();
                    newSeq.addCards(permutations[ix]);
                    ret.push(newSeq);
                }
                return ret;
            };
            return SeqVal;
        })();
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
//# sourceMappingURL=ThreePlayerCribbageSpec.js.map