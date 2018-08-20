import {DeckActions} from '../../interfaces/ideck';
import {BaseCard as Card} from '../items/card';
import {ItemCollection} from './item_collection';

export class BaseDeck<SomeCardClass extends Card> extends ItemCollection<SomeCardClass> implements DeckActions {
    removed: Array<SomeCardClass>;

    constructor(cards: Array<SomeCardClass>) {
        super(cards);
        this.removed = [];
    }

    shuffle() {
        // Put back any removed cards
        for (let index = 0; index < this.removed.length; index++) {
            this.items.push(this.removed[index]);
        }
        this.removed = [];
        // Shuffle using the Fisher-Yates array-sorting algorithm
        let numCards = this.countItems();
        while (--numCards > 0) {
            /* tslint:disable-next-line:no-bitwise */
            const newPos = ~~(Math.random() * (numCards + 1));
            const oldCard = this.itemAt(newPos);
            this.items[newPos] = this.itemAt(numCards);
            this.items[numCards] = oldCard;
        }
    }

    draw() {
        const card = this.items.shift();
        this.removed.push(card);
        return card;
    }

    randomDraw(withReplacement: boolean) {
        const index = Math.floor(Math.random() * this.countItems());
        const card = this.itemAt(index);
        if (!withReplacement) {
            this.removed.push(card);
            this.items.splice(index, 1);
        }
        return card;
    }

    getCards(): Array<Card> {
        const cards = [];
        for (const item of this.items) {
            cards.push(item);
        }
        return cards;
    }

    toString() {
        return 'DeckBase';
    }
}
