/// <reference path="../base_classes/collections/hand.ts" />
/// <reference path="../base_classes/items/card.ts" />

import {BaseHand} from "../base_classes/collections/hand";
import {BaseCard as Card, Suit, Value} from "../base_classes/items/card";
import {Sequence} from "../base_classes/card_game";
import {ItemCollection} from "../base_classes/collections/item_collection";

"use strict";

class RunLength {
    numRuns: number;
    runLength: number;
    constructor(runs: number, length: number) {
        this.numRuns = runs;
        this.runLength = length;
    }
}

export class CribbageHand extends BaseHand {
    constructor(cards: Array<Card>) {
        super(cards);
    }
    countPoints(cutCard: Card, mustHaveFiveCardFlush: boolean) {
        var points = 0;
        this.takeCard(cutCard);
        // Count pairs
        points += this.countPairs();
        // Count 15s
        points += this.countFifteens(0, 0);
        // Count runs
        var runLength = this.countRuns();
        if (runLength.runLength >= 3) {
            points += (runLength.runLength * runLength.numRuns);
        }
        // Count the right jack
        if (cutCard.value != Value.Jack && this.indexOfItem(new Card(cutCard.suit, Value.Jack)) != -1) {
            points++;
        }
        // Count flush
        var numInFlush = 0;
        numInFlush = this.countFlush();
        var maxFlush = (numInFlush == 5);
        if (!maxFlush) {
            if (mustHaveFiveCardFlush) {
                // All 5 cards must be a flush for it to count
                numInFlush = 0;
            }
            else {
                // Check for a flush without the cut card
                this.removeItem(cutCard);
                numInFlush = this.countFlush();
                this.addItem(cutCard);
            }
        }
        if (numInFlush >= (mustHaveFiveCardFlush ? 5 : 4)) {
            points += numInFlush;
        }
        return points;
    }
    static getCardValue(card: Card) {
        if (card.value > 10) {
            return 10;
        }
        else {
            return card.value;
        }
    }
    private static findDuplicates(hand: CribbageHand): Array<Card> {
        hand.sortCards();
        var duplicates:Array<Card> = [];
        for (var index = hand.size() - 1; index >= 0; index--) {
            var card = hand.itemAt(index);
            for (var subIx = index-1; subIx >= 0; subIx--) {
                var subCard = hand.itemAt(subIx);
                if (subCard.value == card.value) {
                    duplicates.push(subCard);
                    hand.playCard(subCard);
                    index--;
                }
            }
        }
        return duplicates;
    }

    /**
     * Count the points from pairs
     * @returns {number} the number of points gained from the pairs
     */
    private countPairs(): number {
        var hand = this.makeCopy();
        var duplicates = CribbageHand.findDuplicates(hand);
        var points = 0;
        for (var ix = 0; ix < duplicates.length; ix++) {
            var dup = duplicates[ix];
            var matches = 1; // It had to match at least once to be a duplicate
            for (var subIx = ix + 1; subIx < duplicates.length; subIx++) {
                if (duplicates[subIx].value == dup.value) {
                    matches++;
                    duplicates.splice(subIx, 1);
                    subIx--;
                }
            }
            points += (matches == 1 ? 2 : matches == 2 ? 6 : 12);
        }
        return points;
    }
    private countRuns(): RunLength {
        // Separate out the duplicates
        var hand = this.makeCopy();
        var duplicates = CribbageHand.findDuplicates(hand);
        // Check for a run - if there is, then see if the duplicates can be used for additional runs
        hand.sortCards();
        var longestRun:Array<Card> = [];
        (function findLongestRun(aHand: CribbageHand) {
            if (aHand.size() >= 3) {
                aHand.sortCards();
                var counter = 0;
                var subLongestCards = [aHand.itemAt(counter++), aHand.itemAt(counter++), aHand.itemAt(counter++)];
                var subLongest = [subLongestCards[0].value, subLongestCards[1].value, subLongestCards[2].value];
                while (Sequence.isSequentialAscending(subLongest)) {
                    if (counter < aHand.size()) {
                        subLongest.push(aHand.itemAt(counter).value);
                        if (Sequence.isSequentialAscending(subLongest))
                            subLongestCards.push(aHand.itemAt(counter));
                        counter++;
                    }
                    else {
                        if (subLongestCards.length > longestRun.length) {
                            longestRun = subLongestCards;
                        }
                        break;
                    }
                    if (subLongestCards.length > longestRun.length) {
                        longestRun = subLongestCards;
                    }
                }
                aHand.playCard(aHand.itemAt(0));
                findLongestRun(aHand);
            }
        })(hand);
        var runLength = new RunLength(0, 0);
        if (longestRun.length >= 3) {
            // Check for how many runs there are
            runLength.runLength = longestRun.length;
            runLength.numRuns = 1;
            var lastDup:Card = null;
            for (var dupIx = 0; dupIx < duplicates.length; dupIx++) {
                var dup = duplicates[dupIx];
                for (var runIx = 0; runIx < longestRun.length; runIx++) {
                    var runCard = longestRun[runIx];
                    if (runCard.value == dup.value) {
                        if (lastDup && lastDup.value == dup.value)
                            runLength.numRuns++;
                        else
                            runLength.numRuns *= 2;
                    }
                }
                lastDup = dup;
            }
        }
        return runLength;
    }
    private countFlush(): number {
        var hearts = 0, spades = 0, diamonds = 0, clubs = 0;
        for (var index = 0; index < this.size(); index++) {
            var suit = this.itemAt(index).suit;
            switch (suit) {
                case Suit.Clubs: clubs++; break;
                case Suit.Diamonds: diamonds++; break;
                case Suit.Hearts: hearts++; break;
                case Suit.Spades: spades++; break;
            }
        }
        return Math.max.apply(Math, [hearts, spades, diamonds, clubs]);
    }
    private makeCopy(): CribbageHand {
        var cards:Array<Card> = [];
        for (var index = 0; index < this.size(); index++) {
            var card = this.itemAt(index);
            cards.push(new Card(card.suit, card.value));
        }
        return new CribbageHand(cards);
    }
    private countFifteens(j: number, total: number): number {
        var score = 0;
        for (; j < 5; j++) {
            var subtotal = (total + CribbageHand.getCardValue(this.itemAt(j)));
            if (subtotal == 15)
                score += 2;
            else if (subtotal < 15)
                score += this.countFifteens(j+1, subtotal);
        }
        return score;
    }
}
