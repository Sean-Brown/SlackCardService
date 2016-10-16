import {CribbageStrings} from "../../card_service/implementations/cribbage";
import {CribbageRoutes} from "../../routes/Cribbage";
import {BaseCard as Card, Suit, Value} from "../../card_service/base_classes/items/card";
import Router = CribbageRoutes.Router;

describe("Test the logic of the CribbageRoutes module", function() {
    describe("Test parsing cards", function() {
        var aceOfSpaces     = new Card(Suit.Spades,     Value.Ace),
            fourOfHearts    = new Card(Suit.Hearts,     Value.Four),
            tenOfClubs      = new Card(Suit.Clubs,      Value.Ten),
            queenOfDiamonds = new Card(Suit.Diamonds,   Value.Queen);
        it("parses one card correctly", function() {
            var cards = Router.parseCards("AS");
            expect(cards.length).toEqual(1);
            expect(cards[0].equalsOther(aceOfSpaces)).toBe(true);
        });
        it("parses two cards correctly", function() {
            var cards = Router.parseCards("AS 4H");
            expect(cards.length).toEqual(2);
            expect(cards[0].equalsOther(aceOfSpaces)).toBe(true);
            expect(cards[1].equalsOther(fourOfHearts)).toBe(true);
        });
        it("allows a ten to be entered as '10' or 't'", function() {
            var cards = Router.parseCards("10s tc");
            expect(cards.length).toEqual(2);
            expect(cards[0].value).toEqual(Value.Ten);
            expect(cards[1].value).toEqual(Value.Ten);
        });
        it("parses multiple cards correctly", function() {
            var cards = Router.parseCards("AS 4H 10C QD");
            expect(cards.length).toEqual(4);
            expect(cards[0].equalsOther(aceOfSpaces)).toBe(true);
            expect(cards[1].equalsOther(fourOfHearts)).toBe(true);
            expect(cards[2].equalsOther(tenOfClubs)).toBe(true);
            expect(cards[3].equalsOther(queenOfDiamonds)).toBe(true);
        });
        it("strips all spaces", function() {
            var cards = Router.parseCards("  AS  4H  ");
            expect(cards.length).toEqual(2);
            expect(cards[0].equalsOther(aceOfSpaces)).toBe(true);
            expect(cards[1].equalsOther(fourOfHearts)).toBe(true);
        });
        it("does a case-insensitive match", function() {
            var lowerCards = Router.parseCards("as 4h");
            var upperCards = Router.parseCards("AS 4H");
            expect(lowerCards.length).toEqual(upperCards.length);
            expect(lowerCards[0].equalsOther(upperCards[0])).toBe(true);
            expect(lowerCards[1].equalsOther(upperCards[1])).toBe(true);
        });
        it("throws when the syntax is wrong", function() {
            expect(() => Router.parseCards("11H")).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
            expect(() => Router.parseCards("lolwut")).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
            expect(() => Router.parseCards("")).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
            expect(() => Router.parseCards(null)).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
        });
    });
});

