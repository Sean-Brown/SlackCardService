var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var player_1 = require("../base_classes/items/player");
var item_collection_1 = require("../base_classes/collections/item_collection");
var cribbage_hand_1 = require("./cribbage_hand");
"use strict";
var PlayedCards = (function (_super) {
    __extends(PlayedCards, _super);
    function PlayedCards(cards) {
        _super.call(this, cards);
    }
    PlayedCards.prototype.removeAll = function () {
        this.items.splice(0, this.items.length);
    };
    PlayedCards.prototype.addCard = function (card) {
        this.items.push(card);
    };
    return PlayedCards;
})(item_collection_1.ItemCollection);
var CribbagePlayer = (function (_super) {
    __extends(CribbagePlayer, _super);
    function CribbagePlayer(name, hand) {
        _super.call(this, name, hand);
        this.points = 0;
        this.played = new PlayedCards([]);
    }
    CribbagePlayer.prototype.addPoints = function (points) {
        this.points += points;
    };
    CribbagePlayer.prototype.playCard = function (card) {
        var played = _super.prototype.playCard.call(this, card);
        if (played) {
            this.played.addCard(card);
        }
        return played;
    };
    CribbagePlayer.prototype.takeCard = function (card) {
        return this.hand.takeCard(card);
    };
    CribbagePlayer.prototype.canPlay = function (count) {
        var canPlay = false;
        for (var index = 0; index < this.hand.countItems(); index++) {
            if (this.hand.itemAt(index).value + count <= 31) {
                canPlay = true;
                break;
            }
        }
        return canPlay;
    };
    CribbagePlayer.prototype.resetCards = function () {
        this.hand = new cribbage_hand_1.CribbageHand([]);
        this.played.removeAll();
    };
    CribbagePlayer.prototype.countPoints = function (cutCard) {
        this.hand.addItems(this.played.items);
        this.played.removeAll();
        var cribHand = new cribbage_hand_1.CribbageHand(this.hand.items.slice(0));
        return cribHand.countPoints(cutCard, false);
    };
    return CribbagePlayer;
})(player_1.BasePlayer);
exports.CribbagePlayer = CribbagePlayer;
//# sourceMappingURL=cribbage_player.js.map