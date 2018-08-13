import * as expect from 'expect';
import {aceOfSpades} from '../StandardCards';

describe('Test the BaseCard', function () {
    it('should print its name correctly', function () {
        expect(aceOfSpades.toString()).toEqual('Ace of Spades');
    });
});
