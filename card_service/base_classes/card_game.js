var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var item_collection_1 = require("./collections/item_collection");
"use strict";
function removeLastTwoChars(str) {
    var ret = "";
    var len = str.length;
    if (len == 1) {
        ret = str.substring(0);
    }
    else if (len > 1) {
        ret = str.substring(0, len - 2);
    }
    return ret;
}
exports.removeLastTwoChars = removeLastTwoChars;
var Players = (function (_super) {
    __extends(Players, _super);
    function Players(players) {
        _super.call(this, players);
    }
    Players.prototype.addPlayer = function (player) {
        this.addItem(player);
    };
    Players.prototype.findPlayer = function (playerName) {
        var player = null;
        for (var index = 0; index < this.countItems(); index++) {
            var tmp = this.itemAt(index);
            if (tmp.name == playerName) {
                player = tmp;
                break;
            }
        }
        return player;
    };
    return Players;
})(item_collection_1.ItemCollection);
exports.Players = Players;
var Teams = (function () {
    function Teams(teams) {
        this.teams = teams;
    }
    Teams.prototype.findTeam = function (player) {
        var team = null;
        var hasPlayer = false;
        for (var ix = 0; ix < this.teams.countItems(); ix++) {
            hasPlayer = this.teams.itemAt(ix).hasPlayer(player);
            if (hasPlayer) {
                team = this.teams.itemAt(ix);
                break;
            }
        }
        return team;
    };
    Teams.prototype.removeAll = function () {
        this.teams.removeAll();
    };
    Teams.prototype.addTeam = function (team) {
        this.teams.addItem(team);
    };
    Teams.prototype.numTeams = function () {
        return this.teams.countItems();
    };
    return Teams;
})();
exports.Teams = Teams;
var Sequence = (function () {
    function Sequence() {
        this.cards = new item_collection_1.ItemCollection([]);
    }
    Sequence.prototype.addCard = function (card) {
        var index = this.cards.indexOfItem(card);
        if (index != -1) {
            throw "Attempting to add a card that's already in the sequence!";
        }
        this.cards.addItem(card);
        return this.countPoints();
    };
    Sequence.prototype.addCards = function (cards) {
        for (var index = 0; index < cards.length; index++) {
            this.addCard(cards[index]);
        }
    };
    Sequence.prototype.length = function () {
        return this.cards.countItems();
    };
    Sequence.prototype.countPoints = function () {
        return this.findLongestReverseSequence() + this.countOfAKind();
    };
    Sequence.prototype.removeAll = function () {
        this.cards.removeAll();
    };
    Sequence.prototype.toString = function () {
        var ret = '';
        for (var ix = 0; ix < this.cards.countItems(); ix++) {
            ret += (this.cards.itemAt(ix).toString() + ', ');
        }
        ret = removeLastTwoChars(ret);
        return ret;
    };
    Sequence.prototype.equalsOther = function (other) {
        if (this.cards.countItems() != other.cards.countItems())
            return false;
        var equals = true;
        for (var ix = 0; ix < this.cards.countItems(); ix++) {
            if (!this.cards.itemAt(ix).equalsOther(other.cards.itemAt(ix))) {
                equals = false;
                break;
            }
        }
        return equals;
    };
    Sequence.isSequentialAscending = function (array) {
        if (array.length < 3) {
            return true;
        }
        var sequential = true;
        var last = -1;
        array.sort(function (n1, n2) { return n1 - n2; });
        for (var ix = 0; ix < array.length; ix++) {
            if (last == -1) {
                last = array[ix];
                continue;
            }
            var next = array[ix];
            if (last != (next - 1)) {
                sequential = false;
                break;
            }
            last = next;
        }
        return sequential;
    };
    Sequence.prototype.findLongestReverseSequence = function () {
        var numItems = this.cards.countItems();
        if (numItems < 3) {
            return 0;
        }
        var values = [];
        var longest = 0;
        for (var ix = numItems - 1; ix >= 0; ix--) {
            values.push(this.cards.itemAt(ix).value);
            if (Sequence.isSequentialAscending(values)) {
                longest = values.length;
            }
        }
        return (longest >= 3 ? longest : 0);
    };
    Sequence.prototype.countOfAKind = function () {
        var matches = 0;
        var index = (this.cards.countItems() - 1);
        var match = this.cards.itemAt(index);
        index--;
        for (index; index >= 0; index--) {
            if (this.cards.itemAt(index).value == match.value) {
                matches++;
            }
            else {
                break;
            }
        }
        return (matches == 1 ? 2 : matches == 2 ? 6 : matches == 3 ? 12 : 0);
    };
    return Sequence;
})();
exports.Sequence = Sequence;
var BaseCardGame = (function () {
    function BaseCardGame(players, teams, name, deck) {
        this.players = players;
        this.teams = teams;
        this.name = name;
        this.deck = deck;
    }
    BaseCardGame.prototype.shuffle = function () {
        this.deck.shuffle();
    };
    BaseCardGame.prototype.getTeam = function (index) { return this.teams.teams.itemAt(index); };
    return BaseCardGame;
})();
exports.BaseCardGame = BaseCardGame;
//# sourceMappingURL=card_game.js.map