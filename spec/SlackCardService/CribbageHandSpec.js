var fs = require("fs");
var card_1 = require("../../card_service/base_classes/items/card");
var cribbage_hand_1 = require("../../card_service/implementations/cribbage_hand");
var image_convert_1 = require("../../routes/Cribbage/image_convert");
"use strict";
var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
    }
};
describe("Test a Cribbage game between two players", function () {
    var aceOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Ace), aceOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Ace), aceOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Ace), aceOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Ace), twoOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Two), twoOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Two), twoOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Two), twoOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Two), threeOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Three), threeOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Three), threeOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Three), fourOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Four), fourOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Four), fourOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Four), fourOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Four), fiveOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Five), fiveOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Five), fiveOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Five), fiveOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Five), sixOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Six), sixOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Six), sixOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Six), sixOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Six), sevenOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Seven), sevenOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Seven), sevenOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Seven), sevenOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Seven), eightOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Eight), eightOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Eight), eightOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Eight), eightOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Eight), nineOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Nine), nineOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Nine), nineOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Nine), tenOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Ten), tenOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Ten), tenOfDiamonds = new card_1.BaseCard(card_1.Suit.Diamonds, card_1.Value.Ten), jackOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Jack), jackOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Jack), jackOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Jack), queenOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.Queen), queenOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.Queen), queenOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.Queen), kingOfClubs = new card_1.BaseCard(card_1.Suit.Clubs, card_1.Value.King), kingOfHearts = new card_1.BaseCard(card_1.Suit.Hearts, card_1.Value.King), kingOfSpades = new card_1.BaseCard(card_1.Suit.Spades, card_1.Value.King);
    beforeEach(function () {
    });
    describe("Test various counting scenarios", function () {
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([aceOfClubs, fourOfHearts, eightOfClubs, eightOfHearts]);
            expect(hand.countPoints(queenOfSpades, false)).toEqual(4);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([aceOfDiamonds, aceOfSpades, sixOfSpades, tenOfDiamonds]);
            expect(hand.countPoints(queenOfSpades, false)).toEqual(2);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([aceOfClubs, fourOfHearts, tenOfDiamonds, tenOfClubs]);
            expect(hand.countPoints(fourOfSpades, false)).toEqual(12);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([twoOfClubs, threeOfSpades, threeOfHearts, jackOfHearts]);
            expect(hand.countPoints(fourOfSpades, false)).toEqual(12);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([aceOfClubs, aceOfDiamonds, aceOfHearts, fourOfClubs]);
            expect(hand.countPoints(fourOfSpades, false)).toEqual(8);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([aceOfClubs, twoOfClubs, threeOfHearts, tenOfDiamonds]);
            expect(hand.countPoints(jackOfHearts, false)).toEqual(7);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([twoOfClubs, threeOfSpades, threeOfHearts, jackOfSpades]);
            expect(hand.countPoints(jackOfHearts, false)).toEqual(12);
        });
        it("counts with the right-jack correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([twoOfClubs, threeOfSpades, threeOfHearts, jackOfSpades]);
            expect(hand.countPoints(queenOfSpades, false)).toEqual(11);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([eightOfDiamonds, jackOfClubs, queenOfSpades, kingOfHearts]);
            expect(hand.countPoints(eightOfClubs, true)).toEqual(6);
        });
        it("counts four-of-a-kinds correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([twoOfClubs, twoOfDiamonds, twoOfHearts, twoOfSpades]);
            expect(hand.countPoints(fourOfHearts, true)).toEqual(12);
        });
        it("counts correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([threeOfDiamonds, fourOfDiamonds, fiveOfDiamonds, sevenOfSpades]);
            expect(hand.countPoints(nineOfDiamonds, false)).toEqual(5);
        });
        it("counts double-doubles correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([eightOfClubs, eightOfHearts, nineOfDiamonds, nineOfClubs]);
            expect(hand.countPoints(tenOfSpades, false)).toEqual(16);
        });
        it("counts triple runs of 3 correctly", function () {
            var hand = new cribbage_hand_1.CribbageHand([eightOfClubs, eightOfHearts, eightOfSpades, nineOfClubs]);
            expect(hand.countPoints(tenOfSpades, false)).toEqual(15);
        });
        it("is able to show a player's cards", function (done) {
            var runTest = false;
            if (runTest) {
                process.env.AWS_S3_STANDARD_DECK_URL = "https://s3.amazonaws.com/slackcardservice/StandardDeck/";
                var tmpPath = "../public", user = "TestUser";
                image_convert_1.ImageConvert.makeHandImage(new cribbage_hand_1.CribbageHand([
                    aceOfClubs,
                    twoOfClubs,
                    threeOfDiamonds,
                    fourOfSpades,
                    fiveOfHearts
                ]), user, tmpPath)
                    .done(function (result) {
                    expect(result.indexOf(user + ".png")).not.toEqual(-1);
                    deleteFolderRecursive(tmpPath);
                    done();
                });
            }
            else {
                done();
            }
        });
    });
});
//# sourceMappingURL=CribbageHandSpec.js.map