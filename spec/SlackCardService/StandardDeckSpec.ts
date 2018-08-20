import * as expect from 'expect';
import { BaseCard } from '../../card_service/base_classes/items/card';
import { StandardDeck } from '../../card_service/implementations/standard_deck';

describe('Test the Standard Deck\'s functionality', function () {
    let deck: StandardDeck;
    beforeEach(function () {
        deck = new StandardDeck();
    });
    function makeDeckCopy(cards: Array<BaseCard>) {
        const copy = [];
        for (let index = 0; index < cards.length; index++) {
            const card = cards[index];
            copy.push(new BaseCard(card.suit, card.value));
        }
        return copy;
    }

    it('has the right number of cards', function () {
        expect(deck.countItems()).toEqual(52);
    });
    it('shuffles', function () {
        const original = makeDeckCopy(deck.items);
        deck.shuffle();
        let orderIsDifferent = false;
        for (let ix = 0; ix < original.length; ix++) {
            if (!original[ix].equalsOther(deck.items[ix])) {
                orderIsDifferent = true;
                break;
            }
        }
        expect(orderIsDifferent).toBe(true);
    });
    it('draws from the top of the deck', function () {
        const topCard = deck.items[0];
        const draw = deck.draw();
        expect(topCard.equalsOther(draw)).toBe(true);
        expect(topCard.equalsOther(deck.items[0])).toBe(false);
    });
    it('randomly draws a card and puts it back', function () {
        const card = deck.randomDraw(true);
        expect(deck.items).toContain(card);
    });
    it('randomly draws a card and does not put it back', function () {
        const card = deck.randomDraw(false);
        expect(deck.items).toNotContain(card);
    });
    it('prints all the cards correctly', function () {
        for (let ix = 0; ix < deck.countItems(); ix++) {
            expect(deck.itemAt(ix).toString().indexOf('undefined')).toBe(-1);
        }
    });
});
