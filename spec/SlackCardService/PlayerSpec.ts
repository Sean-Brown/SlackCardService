import * as expect from 'expect';
import { BaseHand } from '../../card_service/base_classes/collections/hand';
import { BasePlayer } from '../../card_service/base_classes/items/player';
import { aceOfSpades, kingOfClubs, queenOfDiamonds, tenOfHearts } from '../StandardCards';

describe('Test the Base Player\'s functionality', function () {
    let player;
    beforeEach(function () {
        player = new BasePlayer('Bob', new BaseHand([
            aceOfSpades,
            tenOfHearts,
            queenOfDiamonds,
            kingOfClubs
        ]));
    });
    it('equals another player with the same name', function () {
        const other = new BasePlayer('Bob', new BaseHand([]));
        expect(player.equalsOther(other)).toBe(true);
    });
    it('is not equal to another player with a different name', function () {
        const other = new BasePlayer('Bob Pfeffer', new BaseHand([]));
        expect(player.equalsOther(other)).toBe(false);
    });
});
