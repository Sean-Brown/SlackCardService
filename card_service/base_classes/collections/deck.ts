/// <reference path="../../interfaces/ideck.ts" />
/// <reference path="item_collection.ts" />
/// <reference path="../items/card.ts" />

import {DeckActions} from "../../interfaces/ideck";
import {ItemCollection} from "./item_collection";
import {BaseCard as Card} from "../items/card";

"use strict";

export class BaseDeck<SomeCardClass extends Card> extends ItemCollection<SomeCardClass> implements DeckActions {
    removed: Array<SomeCardClass>;
    constructor(cards: Array<SomeCardClass>) {
        super(cards);
        this.removed = [];
    }
    shuffle() {
        // Put back any removed cards
        for (var index = 0; index < this.removed.length; index++) {
            this.items.push(this.removed[index]);
        }
        this.removed = [];
        // Shuffle using the Fisher-Yates array-sorting algorithm
        var numCards = this.countItems();
        while ( --numCards > 0 ) {
            var newPos = ~~(Math.random() * (numCards + 1));
            var oldCard = this.itemAt(newPos);
            this.items[newPos] = this.itemAt(numCards);
            this.items[numCards] = oldCard;
        }
    }
    draw() {
        var card = this.items.shift();
        this.removed.push(card);
        return card;
    }
    randomDraw(withReplacement: boolean) {
        var index = Math.floor(Math.random() * this.countItems());
        var card = this.itemAt(index);
        if (!withReplacement) {
            this.removed.push(card);
            this.items.splice(index, 1);
        }
        return card;
    }
    getCards(): Array<Card> {
        var cards = [];
        for (var item in this.items) {
            cards.push(this.items[item]);
        }
        return cards;
    }
    toString() {
        return "DeckBase";
    }
}
