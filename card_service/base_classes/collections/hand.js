var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var item_collection_1 = require("./item_collection");
"use strict";
var BaseHand = (function (_super) {
    __extends(BaseHand, _super);
    function BaseHand(cards) {
        _super.call(this, cards);
    }
    BaseHand.prototype.playCard = function (card) {
        var index = this.indexOfItem(card);
        var inHand = (index != -1);
        if (inHand) {
            this.items.splice(index, 1);
        }
        return inHand;
    };
    BaseHand.prototype.takeCard = function (card) {
        var index = this.indexOfItem(card);
        var taken = (index == -1);
        if (taken) {
            this.items.push(card);
        }
        return taken;
    };
    BaseHand.prototype.sortCards = function () {
        this.items.sort(function (c1, c2) { return c1.value - c2.value; });
    };
    BaseHand.prototype.size = function () {
        return this.items.length;
    };
    return BaseHand;
})(item_collection_1.ItemCollection);
exports.BaseHand = BaseHand;
//# sourceMappingURL=hand.js.map