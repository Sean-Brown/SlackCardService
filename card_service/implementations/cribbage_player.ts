/// <reference path="../base_classes/items/card.ts" />
/// <reference path="../base_classes/items/player.ts" />
/// <reference path="../base_classes/collections/item_collection.ts" />
/// <reference path="../base_classes/card_game.ts" />
/// <reference path="cribbage_hand.ts" />

import {BaseCard as Card} from "../base_classes/items/card";
import {BasePlayer as Player} from "../base_classes/items/player";
import {ItemCollection} from "../base_classes/collections/item_collection";
import {BaseCardGame as CardGame} from "../base_classes/card_game";
import {CribbageHand} from "./cribbage_hand";

"use strict";

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
        var played = super.playCard(card);
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
        var canPlay = false;
        for (var index = 0; index < this.hand.countItems(); index++) {
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
        var cribHand = new CribbageHand(this.hand.items.slice(0));
        return cribHand.countPoints(cutCard, false);
    }
}
