/// <reference path="../../interfaces/ihand.ts" />
/// <reference path="item_collection.ts" />
/// <reference path="../items/card.ts" />

import {ItemCollection} from "./item_collection";
import {BaseCard as Card} from "../items/card";
import {HandActions} from "../../interfaces/ihand";

"use strict";

export class BaseHand extends ItemCollection<Card> implements HandActions {
    constructor(cards: Array<Card>) {
        super(cards);
    }
    playCard(card: Card) {
        var index = this.indexOfItem(card);
        var inHand = (index != -1);
        if (inHand) {
            this.items.splice(index, 1);
        }
        return inHand;
    }
    takeCard(card: Card) {
        var index = this.indexOfItem(card);
        var taken = (index == -1);
        if (taken) {
            this.items.push(card);
        }
        return taken;
    }
    sortCards() {
        this.items.sort(function(c1, c2) { return c1.value - c2.value; });
    }
    size() {
        return this.items.length;
    }

    /**
     * Return the hand in short-string form, for example:
     * three of clubs, two of spades would return "3c 2s"
     * @returns {string}
     */
    toShortString():string {
        var str = [];
        for (let ix = 0; ix < this.countItems(); ix++) {
            str.push(this.itemAt(ix).shortString());
        }
        return str.join(" ");
    }
}
