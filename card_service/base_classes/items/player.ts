import {IItem} from '../../interfaces/iitem';
import {PlayerActions} from '../../interfaces/iplayer';
import {BaseHand as Hand} from '../collections/hand';
import {BaseCard as Card} from './card';

export class BasePlayer implements PlayerActions, IItem {
    name: string;
    hand: Hand;

    constructor(name: string, hand: Hand) {
        this.name = name;
        this.hand = hand;
    }

    playCard(card: Card) {
        return this.hand.playCard(card);
    }

    numCards() {
        return this.hand.size();
    }

    equalsOther(player: BasePlayer) {
        let equals = false;
        if (player) {
            equals = (this.name === player.name);
        }
        return equals;
    }
}
