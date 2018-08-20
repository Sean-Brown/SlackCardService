import * as expect from 'expect';
import { Value } from '../../card_service/base_classes/items/card';
import { CribbageStrings } from '../../card_service/implementations/cribbage';
import { CribbageRoutes } from '../../routes/Cribbage';
import Router = CribbageRoutes.Router;
import { aceOfSpades, fourOfHearts, queenOfDiamonds, tenOfClubs } from '../StandardCards';

describe('Test the logic of the CribbageRoutes module', function () {
    describe('Test parsing cards', function () {
        // it('parses one card correctly', function () {
        //     const cards = Router.parseCards('AS');
        //     expect(cards.length).toEqual(1);
        //     expect(cards[0].equalsOther(aceOfSpades)).toBe(true);
        // });
        // it('parses two cards correctly', function () {
        //     const cards = Router.parseCards('AS 4H');
        //     expect(cards.length).toEqual(2);
        //     expect(cards[0].equalsOther(aceOfSpades)).toBe(true);
        //     expect(cards[1].equalsOther(fourOfHearts)).toBe(true);
        // });
        // it('allows a ten to be entered as \'10\' or \'t\'', function () {
        //     const cards = Router.parseCards('10s tc');
        //     expect(cards.length).toEqual(2);
        //     expect(cards[0].value).toEqual(Value.Ten);
        //     expect(cards[1].value).toEqual(Value.Ten);
        // });
        // it('parses multiple cards correctly', function () {
        //     const cards = Router.parseCards('AS 4H 10C QD');
        //     expect(cards.length).toEqual(4);
        //     expect(cards[0].equalsOther(aceOfSpades)).toBe(true);
        //     expect(cards[1].equalsOther(fourOfHearts)).toBe(true);
        //     expect(cards[2].equalsOther(tenOfClubs)).toBe(true);
        //     expect(cards[3].equalsOther(queenOfDiamonds)).toBe(true);
        // });
        // it('strips all spaces', function () {
        //     const cards = Router.parseCards('  AS  4H  ');
        //     expect(cards.length).toEqual(2);
        //     expect(cards[0].equalsOther(aceOfSpades)).toBe(true);
        //     expect(cards[1].equalsOther(fourOfHearts)).toBe(true);
        // });
        // it('does a case-insensitive match', function () {
        //     const lowerCards = Router.parseCards('as 4h');
        //     const upperCards = Router.parseCards('AS 4H');
        //     expect(lowerCards.length).toEqual(upperCards.length);
        //     expect(lowerCards[0].equalsOther(upperCards[0])).toBe(true);
        //     expect(lowerCards[1].equalsOther(upperCards[1])).toBe(true);
        // });
        // it('throws when the syntax is wrong', function () {
        //     expect(() => Router.parseCards('11H')).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
        //     expect(() => Router.parseCards('lolwut')).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
        //     expect(() => Router.parseCards('')).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
        //     expect(() => Router.parseCards(null)).toThrow(CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX);
        // });
    });
});
