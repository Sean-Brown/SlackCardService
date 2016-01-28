"use strict";
(function (Suit) {
    Suit[Suit["Hearts"] = 0] = "Hearts";
    Suit[Suit["Spades"] = 1] = "Spades";
    Suit[Suit["Diamonds"] = 2] = "Diamonds";
    Suit[Suit["Clubs"] = 3] = "Clubs";
})(exports.Suit || (exports.Suit = {}));
var Suit = exports.Suit;
(function (Value) {
    Value[Value["Ace"] = 1] = "Ace";
    Value[Value["Two"] = 2] = "Two";
    Value[Value["Three"] = 3] = "Three";
    Value[Value["Four"] = 4] = "Four";
    Value[Value["Five"] = 5] = "Five";
    Value[Value["Six"] = 6] = "Six";
    Value[Value["Seven"] = 7] = "Seven";
    Value[Value["Eight"] = 8] = "Eight";
    Value[Value["Nine"] = 9] = "Nine";
    Value[Value["Ten"] = 10] = "Ten";
    Value[Value["Jack"] = 11] = "Jack";
    Value[Value["Queen"] = 12] = "Queen";
    Value[Value["King"] = 13] = "King";
})(exports.Value || (exports.Value = {}));
var Value = exports.Value;
var EnumExt = (function () {
    function EnumExt() {
    }
    EnumExt.getNames = function (e) {
        return Object.keys(e).filter(function (v) { return isNaN(parseInt(v, 10)); });
    };
    return EnumExt;
})();
exports.EnumExt = EnumExt;
var BaseCard = (function () {
    function BaseCard(suit, value) {
        this.suit = suit;
        this.value = value;
    }
    BaseCard.prototype.equalsOther = function (card) {
        if (card == undefined || card == null)
            return false;
        return (this.suit == card.suit && this.value == card.value);
    };
    BaseCard.prototype.toString = function () {
        return (Value[this.value] + ' of ' + Suit[this.suit]);
    };
    BaseCard.prototype.toUrlString = function (extension) {
        if (extension === void 0) { extension = "png"; }
        return Value[this.value] + "Of" + Suit[this.suit] + "." + extension;
    };
    return BaseCard;
})();
exports.BaseCard = BaseCard;
//# sourceMappingURL=card.js.map