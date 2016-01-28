var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var deck_1 = require("../base_classes/collections/deck");
var card_1 = require("../base_classes/items/card");
"use strict";
var StandardDeck = (function (_super) {
    __extends(StandardDeck, _super);
    function StandardDeck() {
        var cards = new Array();
        var suitNames = card_1.EnumExt.getNames(card_1.Suit);
        var cardNames = card_1.EnumExt.getNames(card_1.Value);
        for (var ixSuit = 0; ixSuit < suitNames.length; ixSuit++) {
            for (var ixVal = 1; ixVal < cardNames.length + 1; ixVal++) {
                cards.push(new card_1.BaseCard(ixSuit, ixVal));
            }
        }
        _super.call(this, cards);
    }
    return StandardDeck;
})(deck_1.BaseDeck);
exports.StandardDeck = StandardDeck;
//# sourceMappingURL=standard_deck.js.map