var standard_deck_1 = require("../../card_service/implementations/standard_deck");
var card_1 = require("../../card_service/base_classes/items/card");
describe("Test the Standard Deck's functionality", function () {
    var deck;
    beforeEach(function () {
        deck = new standard_deck_1.StandardDeck();
    });
    function makeDeckCopy(cards) {
        var copy = [];
        for (var card in cards) {
            copy.push(new card_1.BaseCard(card.suit, card.value));
        }
        return copy;
    }
    it("has the right number of cards", function () {
        expect(deck.countItems()).toEqual(52);
    });
    it("shuffles", function () {
        var original = makeDeckCopy(deck.items);
        deck.shuffle();
        var orderIsDifferent = false;
        for (var ix = 0; ix < original.length; ix++) {
            if (!original[ix].equalsOther(deck.items[ix])) {
                orderIsDifferent = true;
                break;
            }
        }
        expect(orderIsDifferent).toBe(true);
    });
    it("draws from the top of the deck", function () {
        var topCard = deck.items[0];
        var draw = deck.draw();
        expect(topCard.equalsOther(draw)).toBe(true);
        expect(topCard.equalsOther(deck.items[0])).toBe(false);
    });
    it("randomly draws a card and puts it back", function () {
        var card = deck.randomDraw(true);
        expect(deck.items).toContain(card);
    });
    it("randomly draws a card and does not put it back", function () {
        var card = deck.randomDraw(false);
        expect(deck.items).not.toContain(card);
    });
    it("prints all the cards correctly", function () {
        for (var ix = 0; ix < deck.countItems(); ix++) {
            expect(deck.itemAt(ix).toString().indexOf("undefined")).toBe(-1);
        }
    });
});
//# sourceMappingURL=StandardDeckSpec.js.map