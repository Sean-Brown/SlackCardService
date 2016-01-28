"use strict";
var BasePlayer = (function () {
    function BasePlayer(name, hand) {
        this.name = name;
        this.hand = hand;
    }
    BasePlayer.prototype.playCard = function (card) {
        return this.hand.playCard(card);
    };
    BasePlayer.prototype.numCards = function () {
        return this.hand.size();
    };
    BasePlayer.prototype.equalsOther = function (player) {
        var equals = false;
        if (player)
            equals = (this.name == player.name);
        return equals;
    };
    return BasePlayer;
})();
exports.BasePlayer = BasePlayer;
//# sourceMappingURL=player.js.map