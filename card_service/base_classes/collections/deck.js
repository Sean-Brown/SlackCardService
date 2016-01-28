var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var item_collection_1 = require("./item_collection");
"use strict";
var BaseDeck = (function (_super) {
    __extends(BaseDeck, _super);
    function BaseDeck(cards) {
        _super.call(this, cards);
        this.removed = new Array();
    }
    BaseDeck.prototype.shuffle = function () {
        for (var index = 0; index < this.removed.length; index++) {
            this.items.push(this.removed[index]);
        }
        this.removed = new Array();
        var numCards = this.countItems();
        while (--numCards > 0) {
            var newPos = ~~(Math.random() * (numCards + 1));
            var oldCard = this.itemAt(newPos);
            this.items[newPos] = this.itemAt(numCards);
            this.items[numCards] = oldCard;
        }
    };
    BaseDeck.prototype.draw = function () {
        var card = this.items.shift();
        this.removed.push(card);
        return card;
    };
    BaseDeck.prototype.randomDraw = function (withReplacement) {
        var index = Math.floor(Math.random() * this.countItems());
        var card = this.itemAt(index);
        if (!withReplacement) {
            this.removed.push(card);
            this.items.splice(index, 1);
        }
        return card;
    };
    BaseDeck.prototype.getCards = function () {
        var cards = [];
        for (var item in this.items) {
            cards.push(this.items[item]);
        }
        return cards;
    };
    BaseDeck.prototype.toString = function () {
        return "DeckBase";
    };
    return BaseDeck;
})(item_collection_1.ItemCollection);
exports.BaseDeck = BaseDeck;
//# sourceMappingURL=deck.js.map