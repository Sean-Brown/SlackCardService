var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var card_1 = require("../base_classes/items/card");
var card_game_1 = require("../base_classes/card_game");
var item_collection_1 = require("../base_classes/collections/item_collection");
var cribbage_hand_1 = require("./cribbage_hand");
var cribbage_player_1 = require("./cribbage_player");
var cribbage_team_1 = require("./cribbage_team");
var standard_deck_1 = require("./standard_deck");
"use strict";
var Mode;
(function (Mode) {
    Mode[Mode["FFA"] = 0] = "FFA";
    Mode[Mode["Team"] = 1] = "Team";
})(Mode || (Mode = {}));
var CribbageStrings;
(function (CribbageStrings) {
    var MessageStrings = (function () {
        function MessageStrings() {
        }
        Object.defineProperty(MessageStrings, "FMT_START_GAME", {
            get: function () { return "The game is afoot, throw your cards to "; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MessageStrings, "GAME_RESET", {
            get: function () { return "The game was reset"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MessageStrings, "GAME_OVER", {
            get: function () { return "Game over!"; },
            enumerable: true,
            configurable: true
        });
        return MessageStrings;
    })();
    CribbageStrings.MessageStrings = MessageStrings;
    var ErrorStrings = (function () {
        function ErrorStrings() {
        }
        Object.defineProperty(ErrorStrings, "NO_GAME", {
            get: function () { return "The game hasn't been created. Add some players first."; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "HAS_BEGUN", {
            get: function () { return "The game has already begun"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "INVALID_CARD_SYNTAX", {
            get: function () {
                return "Invalid syntax. Enter your card as (value)(suit), for example enter the five of hearts as 5H";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "TOO_MANY_CARDS", {
            get: function () { return "You can only play one card!"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "INVALID_NUMBER_OF_PLAYERS", {
            get: function () { return "Invalid number of players"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "INVALID_NUM_CARDS_THROWN_TO_KITTY", {
            get: function () { return "Invalid number of cards given to the kitty"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "DUPLICATE_CARD_THROWN_TO_KITTY", {
            get: function () { return "You must throw two UNIQUE cards to the kitty"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "INVALID_THROWER", {
            get: function () { return "You aren't allowed to throw any cards!"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "KITTY_NOT_READY", {
            get: function () { return "The kitty still needs people to throw to it"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "KITTY_IS_READY", {
            get: function () { return "The kitty already has all the cards it needs."; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "EXCEEDS_31", {
            get: function () { return "Exceeds 31"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "FMT_NOT_NEXT_PLAYER", {
            get: function () { return "The next player is "; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "FMT_PLAYER_DOESNT_HAVE_CARD", {
            get: function () { return "You don't have "; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "PLAYER_DOES_NOT_EXIST", {
            get: function () { return "You're not part of the game!"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "PLAYER_ALREADY_IN_GAME", {
            get: function () { return "You're already in the game"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "PLAYER_CAN_PLAY", {
            get: function () { return "You have a card you can still play"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "PLAYER_NOT_IN_PLAY", {
            get: function () { return "You've already said \"go\""; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ErrorStrings, "GAME_HAS_ALREADY_BEGUN", {
            get: function () { return "The game has already begun!"; },
            enumerable: true,
            configurable: true
        });
        return ErrorStrings;
    })();
    CribbageStrings.ErrorStrings = ErrorStrings;
})(CribbageStrings = exports.CribbageStrings || (exports.CribbageStrings = {}));
var CribbageGameDescription = (function () {
    function CribbageGameDescription(dealer, nextPlayer, cutCard, count, sequence, scores, players) {
        this.dealer = dealer;
        this.nextPlayer = nextPlayer;
        this.cutCard = cutCard;
        this.count = count;
        this.sequence = sequence;
        this.scores = scores;
        this.players = players;
    }
    return CribbageGameDescription;
})();
exports.CribbageGameDescription = CribbageGameDescription;
var CribbageReturn = (function () {
    function CribbageReturn(gameOver, message, roundOver) {
        if (gameOver === void 0) { gameOver = false; }
        if (message === void 0) { message = ""; }
        if (roundOver === void 0) { roundOver = false; }
        this.gameOver = gameOver;
        this.message = message;
        this.roundOver = roundOver;
    }
    return CribbageReturn;
})();
exports.CribbageReturn = CribbageReturn;
var MessageStrings = CribbageStrings.MessageStrings;
var ErrorStrings = CribbageStrings.ErrorStrings;
var Cribbage = (function (_super) {
    __extends(Cribbage, _super);
    function Cribbage(players) {
        _super.call(this, players, null, "Cribbage", new standard_deck_1.StandardDeck());
        this.cut = this.dealer = this.lastPlayerToPlay = this.nextPlayerInSequence = this.sequence = this.winningTeam = null;
        this.count = 0;
        this.kitty = new cribbage_hand_1.CribbageHand([]);
        this.playersInPlay = new item_collection_1.ItemCollection([]);
        this.sequence = new card_game_1.Sequence();
        this.hasBegun = false;
    }
    Cribbage.prototype.initializeGame = function () {
        this.numPlayers = this.players.countItems();
        if (this.numPlayers < 2 || this.numPlayers > 6)
            throw ErrorStrings.INVALID_NUMBER_OF_PLAYERS;
        this.mode = (this.numPlayers == 4 || this.numPlayers == 6 ? Mode.Team : Mode.FFA);
        if (this.mode == Mode.Team) {
            if (this.numPlayers == 4) {
                this.teams = new card_game_1.Teams(new item_collection_1.ItemCollection([
                    new cribbage_team_1.CribbageTeam(1, [this.players.itemAt(0), this.players.itemAt(2)]),
                    new cribbage_team_1.CribbageTeam(2, [this.players.itemAt(1), this.players.itemAt(3)])
                ]));
            }
            else {
                this.teams = new card_game_1.Teams(new item_collection_1.ItemCollection([
                    new cribbage_team_1.CribbageTeam(1, [this.players.itemAt(0), this.players.itemAt(3)]),
                    new cribbage_team_1.CribbageTeam(2, [this.players.itemAt(1), this.players.itemAt(4)]),
                    new cribbage_team_1.CribbageTeam(3, [this.players.itemAt(2), this.players.itemAt(5)])
                ]));
            }
        }
        else {
            if (this.teams != null) {
                this.teams.removeAll();
            }
            else {
                this.teams = new card_game_1.Teams(new item_collection_1.ItemCollection([]));
            }
            var id = 1;
            for (var index = 0; index < this.players.countItems(); index++, id++) {
                this.teams.addTeam(new cribbage_team_1.CribbageTeam(id, [this.players.itemAt(index)]));
            }
        }
    };
    Cribbage.prototype.isReady = function () {
        return (this.kitty ? (this.kitty.countItems() == 4) : false);
    };
    Cribbage.prototype.begin = function () {
        if (this.hasBegun) {
            throw ErrorStrings.GAME_HAS_ALREADY_BEGUN;
        }
        else {
            this.initializeGame();
            this.cutForDealer();
            this.deal();
            this.hasBegun = true;
        }
    };
    Cribbage.prototype.giveToKitty = function (playerName, cards) {
        var response = new CribbageReturn();
        var player = this.findPlayer(playerName);
        if (!player)
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        if (this.kitty.size() == 4)
            throw ErrorStrings.KITTY_IS_READY;
        var numThrown = cards.countItems();
        for (var ix = 0; ix < numThrown; ix++) {
            var card = cards.itemAt(ix);
            if (player.hand.indexOfItem(card) == -1) {
                throw ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD + " the " + card.toString() + "!";
            }
        }
        switch (this.numPlayers) {
            case 2:
                if (numThrown != 2) {
                    throw ErrorStrings.INVALID_NUM_CARDS_THROWN_TO_KITTY;
                }
                else if (cards.itemAt(0).equalsOther(cards.itemAt(1))) {
                    throw ErrorStrings.DUPLICATE_CARD_THROWN_TO_KITTY;
                }
                break;
            case 3:
            case 4:
            case 5:
            case 6:
                if (numThrown != 1) {
                    throw ErrorStrings.INVALID_NUM_CARDS_THROWN_TO_KITTY;
                }
                else if (this.numPlayers == 5 && player.equalsOther(this.dealer)) {
                    throw ErrorStrings.INVALID_THROWER;
                }
                else if (this.numPlayers == 6) {
                    var team = this.findTeam(player);
                    for (var ix = 0; ix < team.countPlayers(); ix++) {
                        if (team.playerAt(ix).equalsOther(this.dealer)) {
                            throw ErrorStrings.INVALID_THROWER;
                        }
                    }
                }
                break;
        }
        for (var ix = 0; ix < numThrown; ix++) {
            player.hand.playCard(player.hand.itemAt(player.hand.indexOfItem(cards.itemAt(ix))));
        }
        var card = null;
        for (var index = 0; index < cards.countItems(); index++) {
            card = cards.itemAt(index);
            this.kitty.takeCard(card);
        }
        if (this.kitty.size() == 4) {
            this.cutTheDeck();
            if (this.cut.value == card_1.Value.Jack) {
                if (this.findTeam(this.dealer).addPoints(this.dealer, 2)) {
                    response = this.setGameOver(team);
                }
                else {
                    response.message = "2 points to " + this.dealer.name + " for \"His Heels\" (cutting the right jack)";
                }
            }
        }
        return response;
    };
    Cribbage.prototype.playCard = function (playerName, card) {
        var response = new CribbageReturn();
        if (this.kitty.size() != 4) {
            throw ErrorStrings.KITTY_NOT_READY;
        }
        var player = this.findPlayer(playerName);
        if (!player.equalsOther(this.nextPlayerInSequence)) {
            throw ErrorStrings.FMT_NOT_NEXT_PLAYER + this.nextPlayerInSequence.name;
        }
        while (true) {
            var team = this.teams.findTeam(player);
            var cardValue = cribbage_hand_1.CribbageHand.getCardValue(card);
            if ((this.count + cardValue) > 31) {
                throw ErrorStrings.EXCEEDS_31;
            }
            if (!player.playCard(card)) {
                throw ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD + " the " + card.toString() + "!";
            }
            this.lastPlayerToPlay = player;
            if (player.hand.size() == 0) {
                this.playersInPlay.removeItem(player);
            }
            this.count += cardValue;
            var points = this.sequence.addCard(card);
            if (points > 0) {
                if (team.addPoints(player, points)) {
                    response = this.setGameOver(team);
                    break;
                }
            }
            var is31 = (this.count == 31);
            if (this.count == 15 || is31) {
                points += 2;
                if (team.addPoints(player, 2)) {
                    response = this.setGameOver(team);
                    break;
                }
            }
            if (this.roundOver()) {
                response.roundOver = true;
                if (!is31) {
                    response.message = player.name + " gets a point for a go";
                    if (points > 0) {
                        response.message += " in addition to " + points + " points";
                    }
                }
                else {
                    response.message = player.name + " gets 31 for two points";
                }
                if (team.addPoints(player, 1)) {
                    response = this.setGameOver(team);
                    break;
                }
                else {
                    var scores = this.roundOverResetState();
                    response.message += "\n                " + scores;
                    var ros = this.roundOverStr();
                    response.message += "\n                 " + ros;
                    break;
                }
            }
            else if (is31) {
                this.resetSequence(player);
                this.setNextPlayerInSequence(player);
                break;
            }
            else if (this.playersInPlay.countItems() == 0) {
                points++;
                if (team.addPoints(player, 1)) {
                    response = this.setGameOver(team);
                    break;
                }
                this.resetSequence(null);
                this.setNextPlayerInSequence(player);
                response.message += "\n                Scores: " + this.printScores();
                break;
            }
            else {
                this.nextPlayerInSequence = this.nextPlayerInOrder(this.nextPlayerInSequence);
                this.setNextPlayerInSequence(player);
                break;
            }
            break;
        }
        if (points > 0) {
            response.message = player.name + " scored " + points + " points.\n                " + response.message;
        }
        return response;
    };
    Cribbage.prototype.go = function (playerName) {
        var response = new CribbageReturn();
        var player = this.findPlayer(playerName);
        if (player == null) {
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        }
        if (player.canPlay(this.count)) {
            throw ErrorStrings.PLAYER_CAN_PLAY;
        }
        else if (this.playersInPlay.indexOfItem(player) == -1) {
            throw ErrorStrings.PLAYER_NOT_IN_PLAY;
        }
        else if (!this.nextPlayerInSequence.equalsOther(player)) {
            throw ErrorStrings.FMT_NOT_NEXT_PLAYER + this.nextPlayerInSequence.name;
        }
        else {
            this.playersInPlay.removeItem(player);
        }
        if (this.playersInPlay.countItems() == 0) {
            var team = this.findTeam(this.lastPlayerToPlay);
            response.message = this.lastPlayerToPlay.name + " gets a point for a go.";
            if (team.addPoints(this.lastPlayerToPlay, 1)) {
                response = this.setGameOver(team);
            }
            else if (this.roundOver()) {
                response.roundOver = true;
                this.roundOverResetState();
                response.message += " " + this.roundOverStr();
            }
            else {
                this.resetSequence(player);
                this.setNextPlayerInSequence(player);
                response.message += "\n                The count is back at 0.\n                You're up " + this.nextPlayerInSequence.name;
            }
        }
        else {
            this.setNextPlayerInSequence(player);
        }
        return response;
    };
    Cribbage.prototype.addPlayer = function (player) {
        if (this.findPlayer(player.name)) {
            throw ErrorStrings.PLAYER_ALREADY_IN_GAME;
        }
        else if (this.hasBegun) {
            throw ErrorStrings.GAME_HAS_ALREADY_BEGUN;
        }
        else {
            this.players.addPlayer(player);
        }
    };
    Cribbage.prototype.describe = function () {
        var scores = "";
        if (this.teams) {
            scores = this.printScores();
        }
        var players = [];
        for (var jx = 0; jx < this.players.countItems(); jx++) {
            players.push(this.players.itemAt(jx).name);
        }
        return JSON.stringify(new CribbageGameDescription((this.dealer ? this.dealer.name : ""), (this.nextPlayerInSequence ? this.nextPlayerInSequence.name : ""), (this.cut ? this.cut.toString() : ""), this.count, this.sequence.toString(), scores, players));
    };
    Cribbage.prototype.getPlayerHandStr = function (playerName) {
        var hand = "";
        var player = this.findPlayer(playerName);
        if (player != null) {
            hand = this.printHand(player.hand);
        }
        else {
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        }
        return hand;
    };
    Cribbage.prototype.getPlayerHand = function (playerName) {
        var hand = null;
        var player = this.findPlayer(playerName);
        if (player != null) {
            hand = player.hand;
        }
        else {
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        }
        return hand;
    };
    Cribbage.prototype.setGameOver = function (winningTeam) {
        this.winningTeam = winningTeam;
        return new CribbageReturn(true, MessageStrings.GAME_OVER + " Winning team: " + this.winningTeam.printTeam());
    };
    Cribbage.prototype.printScores = function () {
        var scores = "";
        if (this.teams) {
            for (var ix = 0; ix < this.teams.numTeams(); ix++) {
                scores += "{ ";
                var team = this.teams.teams.itemAt(ix);
                for (var jx = 0; jx < team.numPlayers(); jx++) {
                    scores += (team.itemAt(jx).name + ", ");
                }
                scores = card_game_1.removeLastTwoChars(scores);
                scores += (" = " + team.countPoints() + " }, ");
            }
            scores = card_game_1.removeLastTwoChars(scores);
        }
        return scores;
    };
    Cribbage.prototype.printHand = function (hand) {
        var handStr = "";
        hand.sortCards();
        for (var ix = 0; ix < hand.size(); ix++) {
            handStr += hand.itemAt(ix).toString() + ", ";
        }
        return card_game_1.removeLastTwoChars(handStr);
    };
    Cribbage.prototype.findPlayer = function (playerName) {
        var player = null;
        var match = new cribbage_player_1.CribbagePlayer(playerName, new cribbage_hand_1.CribbageHand([]));
        for (var index = 0; index < this.players.countItems(); index++) {
            var tmp = this.players.itemAt(index);
            if (tmp.equalsOther(match)) {
                player = tmp;
                break;
            }
        }
        return player;
    };
    Cribbage.prototype.printPlayers = function () {
        var players = "";
        for (var jx = 0; jx < this.players.countItems(); jx++) {
            players += this.players.itemAt(jx).name + ", ";
        }
        return card_game_1.removeLastTwoChars(players);
    };
    Cribbage.prototype.roundOverStr = function () {
        return "Round over.\n        The cards have been shuffled and dealt.\n        Throw to " + this.dealer.name + "'s kitty!\n        Scores: " + this.printScores();
    };
    Cribbage.prototype.roundOverResetState = function () {
        var scores = "";
        scores = this.countPoints().message;
        this.cut = null;
        this.lastPlayerToPlay = null;
        this.setNextDealer();
        this.deal();
        return scores;
    };
    Cribbage.prototype.roundOver = function () {
        var done = true;
        for (var index = 0; index < this.players.countItems(); index++) {
            if (this.players.itemAt(index).hand.size() > 0) {
                done = false;
                break;
            }
        }
        return done;
    };
    Cribbage.prototype.countPoints = function () {
        var ret = new CribbageReturn(false, "The cut card is the " + this.cut);
        var firstPlayer = this.nextPlayerInOrder(this.dealer);
        var countingPlayer = firstPlayer;
        do {
            var team = this.findTeam(countingPlayer);
            var points = countingPlayer.countPoints(this.cut);
            if (team.addPoints(countingPlayer, points)) {
                ret = this.setGameOver(team);
                break;
            }
            ret.message += "\n            " + countingPlayer.name + " has hand " + this.printHand(countingPlayer.hand) + " and scored " + points + " points.";
            if (this.dealer.equalsOther(countingPlayer)) {
                points = this.kitty.countPoints(this.cut, true);
                this.kitty.playCard(this.cut);
                if (team.addPoints(countingPlayer, points)) {
                    ret = this.setGameOver(team);
                    break;
                }
                ret.message += "\n                The kitty is " + this.printHand(this.kitty) + " and scores " + points + " points.";
            }
            countingPlayer = this.nextPlayerInOrder(countingPlayer);
        } while (!countingPlayer.equalsOther(firstPlayer));
        return ret;
    };
    Cribbage.prototype.cutForDealer = function () {
        var lowest = null;
        for (var index = 0; index < this.numPlayers; index++) {
            var card = this.deck.randomDraw(false);
            if (lowest == null || card.value < lowest.value) {
                lowest = card;
                this.dealer = this.players.itemAt(index);
            }
        }
        this.nextPlayerInSequence = this.nextPlayerInOrder(this.dealer);
    };
    Cribbage.prototype.resetHands = function () {
        for (var index = 0; index < this.numPlayers; index++) {
            this.players.itemAt(index).hand.removeAll();
        }
    };
    Cribbage.prototype.deal = function () {
        this.kitty.removeAll();
        this.resetHands();
        this.shuffle();
        switch (this.numPlayers) {
            case 2:
                this.dealForTwo();
                break;
            case 3:
                this.dealForThree();
                break;
            case 4:
                this.dealForFour();
                break;
            case 5:
                this.dealForFive();
                break;
            case 6:
                this.dealForSix();
                break;
            default:
                throw ErrorStrings.INVALID_NUMBER_OF_PLAYERS;
        }
        this.resetSequence(null);
    };
    Cribbage.prototype.setNextPlayerInSequence = function (player) {
        if (player != null) {
            if (this.nextPlayerInSequence.equalsOther(player) || this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1) {
                do {
                    this.nextPlayerInSequence = this.nextPlayerInOrder(this.nextPlayerInSequence);
                } while (this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1);
            }
        }
        else if (this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1) {
            do {
                this.nextPlayerInSequence = this.nextPlayerInOrder(this.nextPlayerInSequence);
            } while (this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1);
        }
    };
    Cribbage.prototype.resetSequence = function (player) {
        this.count = 0;
        this.lastPlayerToPlay = null;
        this.sequence.removeAll();
        this.playersInPlay.removeAll();
        for (var ix = 0; ix < this.numPlayers; ix++) {
            var cribPlayer = this.players.itemAt(ix);
            if (cribPlayer.hand.size() > 0) {
                this.playersInPlay.addItem(cribPlayer);
            }
        }
        if (player != null) {
            this.nextPlayerInSequence = this.nextPlayerInOrder(player);
        }
    };
    Cribbage.prototype.cutTheDeck = function () {
        this.cut = this.deck.randomDraw(false);
    };
    Cribbage.prototype.draw = function () {
        return this.deck.draw();
    };
    Cribbage.prototype.dealForTwo = function () {
        var player = this.nextPlayerInOrder(this.dealer);
        while (player.numCards() < 6) {
            var card = this.draw();
            player.hand.takeCard(card);
            player = this.nextPlayerInOrder(player);
        }
    };
    Cribbage.prototype.dealForThree = function () {
        var player = this.nextPlayerInOrder(this.dealer);
        while (player.numCards() < 5) {
            player.takeCard(this.draw());
            player = this.nextPlayerInOrder(player);
        }
        if (this.kitty == null) {
            this.kitty = new cribbage_hand_1.CribbageHand([]);
        }
        this.kitty.takeCard(this.draw());
    };
    Cribbage.prototype.dealForFour = function () {
        var player = this.nextPlayerInOrder(this.dealer);
        while (player.numCards() < 5) {
            player.takeCard(this.draw());
            player = this.nextPlayerInOrder(player);
        }
    };
    Cribbage.prototype.dealForFive = function () {
        throw "Not Implemented!";
    };
    Cribbage.prototype.dealForSix = function () {
        var player = this.nextPlayerInOrder(this.dealer);
        var dealingTeam = this.findTeam(this.dealer);
        while (player.numCards() < 5) {
            if (!(player.equalsOther(this.dealer) || dealingTeam.equalsOther(this.findTeam(player)))) {
                player.takeCard(this.draw());
            }
        }
    };
    Cribbage.prototype.setNextDealer = function () {
        this.dealer = this.nextPlayerInOrder(this.dealer);
        this.nextPlayerInSequence = this.nextPlayerInOrder(this.dealer);
    };
    Cribbage.prototype.nextPlayerInOrder = function (player) {
        var index = this.players.indexOfItem(player);
        if ((index + 1) >= this.numPlayers) {
            index = 0;
        }
        else {
            index++;
        }
        return this.players.itemAt(index);
    };
    Cribbage.prototype.findTeam = function (player) {
        var team = null;
        for (var index = 0; index < this.teams.numTeams(); index++) {
            var t = this.getTeam(index);
            if (t.hasPlayer(player)) {
                team = t;
                break;
            }
        }
        return team;
    };
    return Cribbage;
})(card_game_1.BaseCardGame);
exports.Cribbage = Cribbage;
//# sourceMappingURL=cribbage.js.map