import * as expect from 'expect';
import { BaseHand } from '../../card_service/base_classes/collections/hand';
import { aceOfClubs, aceOfSpades, eightOfClubs, fourOfHearts, jackOfDiamonds } from '../StandardCards';

describe('Test the Hand\'s functionality', function () {
    let hand;
    beforeEach(function () {
        hand = new BaseHand([]);
    });
    it('has no cards', function () {
        expect(hand.size()).toEqual(0);
    });
    it('does not play a card it doesn\'t have', function () {
        expect(hand.playCard(aceOfClubs)).toBe(false);
    });
    describe('Test a Hand with four cards', function () {
        const duplicateCard = eightOfClubs;
        beforeEach(function () {
            hand.takeCard(duplicateCard);
            hand.takeCard(aceOfSpades);
            hand.takeCard(jackOfDiamonds);
            hand.takeCard(fourOfHearts);
        });
        afterEach(function () {
            hand.removeAll();
        });
        it('has four cards', function () {
            expect(hand.size()).toEqual(4);
        });
        it('does not take a card it already has', function () {
            expect(hand.takeCard(duplicateCard)).toBe(false);
        });
        it('can play a card', function () {
            expect(hand.playCard(duplicateCard)).toBe(true);
            expect(hand.size()).toEqual(3);
        });
        it('can take a card', function () {
            expect(hand.takeCard(aceOfClubs)).toBe(true);
        });
    });
});
