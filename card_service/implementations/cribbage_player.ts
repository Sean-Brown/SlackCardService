import {ItemCollection} from '../base_classes/collections/item_collection';
import {BaseCard as Card} from '../base_classes/items/card';
import {BasePlayer as Player} from '../base_classes/items/player';
import {CribbageHand} from './cribbage_hand';

class PlayedCards extends ItemCollection<Card> {
    constructor(cards: Array<Card>) {
        super(cards);
    }
    removeAll(): void {
        this.items.splice(0, this.items.length);
    }
    addCard(card: Card) {
        this.items.push(card);
    }
}

export class CribbagePlayer extends Player {
    points: number;
    played: PlayedCards;
    constructor(name: string, hand: CribbageHand) {
        super(name, hand);
        this.points = 0;
        this.played = new PlayedCards([]);
    }
    addPoints(points: number) {
        this.points += points;
    }
    playCard(card: Card) {
        const played = super.playCard(card);
        if (played) {
            // The card was removed from our hand, so add it to the list of played cards
            this.played.addCard(card);
        }
        return played;
    }
    takeCard(card: Card) {
        return this.hand.takeCard(card);
    }
    canPlay(count: number) {
        let canPlay = false;
        for (let index = 0; index < this.hand.countItems(); index++) {
            if (this.hand.itemAt(index).value + count <= 31) {
                canPlay = true;
                break;
            }
        }
        return canPlay;
    }
    resetCards() {
        this.hand = new CribbageHand([]);
        this.played.removeAll();
    }
    countPoints(cutCard: Card) {
        this.hand.addItems(this.played.items);
        this.played.removeAll();
        const cribHand = new CribbageHand(this.hand.items.slice(0));
        return cribHand.countPoints(cutCard, false);
    }
}
