/// <reference path="../base_classes/items/card.ts" />
/// <reference path="../base_classes/collections/item_collection.ts" />
/// <reference path="../base_classes/card_game.ts" />
/// <reference path="cribbage_hand.ts" />
/// <reference path="cribbage_player.ts" />
/// <reference path="cribbage_team.ts" />
/// <reference path="standard_deck.ts" />

import {BaseCard as Card, Value} from "../base_classes/items/card";
import {BaseCardGame as CardGame, Players, Teams, Sequence, removeLastTwoChars} from "../base_classes/card_game";
import {ItemCollection} from "../base_classes/collections/item_collection";
import {CribbageHand} from "./cribbage_hand";
import {CribbagePlayer} from "./cribbage_player";
import {CribbageTeam} from "./cribbage_team";
import {StandardDeck} from "./standard_deck";

"use strict";

enum Mode {
    FFA, // Free-for-All
    Team
}

// Generic messages
export module CribbageStrings {
    export class MessageStrings {
        static get FMT_START_GAME():string { return "The game is afoot, throw your cards to "; }
        static get GAME_RESET():string { return "The game was reset"; }
        static get GAME_OVER(): string { return "Game over!"; }
    }
    export class ErrorStrings {
        static get NO_GAME():string { return "The game hasn't been created. Add some players first."; }
        static get HAS_BEGUN():string { return "The game has already begun"; }
        static get INVALID_CARD_SYNTAX():string {
            return "Invalid syntax. Enter your card as (value)(suit), for example enter the five of hearts as 5H";
        }
        static get TOO_MANY_CARDS():string { return "You can only play one card!"; }
        static get INVALID_NUMBER_OF_PLAYERS():string { return "Invalid number of players"; }
        static get INVALID_NUM_CARDS_THROWN_TO_KITTY():string { return "Invalid number of cards given to the kitty"; }
        static get DUPLICATE_CARD_THROWN_TO_KITTY():string { return "You must throw two UNIQUE cards to the kitty"; }
        static get INVALID_THROWER():string { return "You aren't allowed to throw any cards!"; }
        static get KITTY_NOT_READY():string { return "The kitty still needs people to throw to it"; }
        static get KITTY_IS_READY():string { return "The kitty already has all the cards it needs."; }
        static get EXCEEDS_31():string { return "Exceeds 31"; }
        static get FMT_NOT_NEXT_PLAYER():string { return "The next player is "; }
        static get FMT_PLAYER_DOESNT_HAVE_CARD():string { return "You don't have "; }
        static get PLAYER_DOES_NOT_EXIST():string { return "You're not part of the game!"; }
        static get PLAYER_ALREADY_IN_GAME():string { return "You're already in the game"; }
        static get PLAYER_CAN_PLAY():string { return "You have a card you can still play"; }
        static get PLAYER_NOT_IN_PLAY():string { return "You've already said \"go\""; }
        static get GAME_HAS_ALREADY_BEGUN():string { return "The game has already begun!"; }
    }
}

export class CribbageGameDescription {
    constructor(public dealer: string,
                public nextPlayer: string,
                public cutCard: string,
                public count: number,
                public sequence: string,
                public scores: string,
                public players: Array<string>
    ){
    }
}

/**
 * Class that will be the return value for route-responding messages
 */
export class CribbageReturn {
    constructor(
        public gameOver:boolean=false,
        public message:string="",
        public roundOver:boolean=false,
        public sequenceOver:boolean=false
    ) {
    }
}

import MessageStrings = CribbageStrings.MessageStrings;
import ErrorStrings = CribbageStrings.ErrorStrings;
export class Cribbage extends CardGame<CribbagePlayer, StandardDeck> {
    cut: Card;
    kitty: CribbageHand;
    mode: Mode;
    dealer: CribbagePlayer;
    lastPlayerToPlay: CribbagePlayer;
    nextPlayerInSequence: CribbagePlayer;
    playersInPlay: ItemCollection<CribbagePlayer>;
    count: number;
    sequence: Sequence;
    numPlayers: number;
    winningTeam: CribbageTeam;
    hasBegun: boolean;

    constructor(players: Players<CribbagePlayer>) {
        super(players, null, "Cribbage", new StandardDeck());
        this.cut = this.dealer = this.lastPlayerToPlay = this.nextPlayerInSequence = this.sequence = this.winningTeam = null;
        this.count = 0;
        this.kitty = new CribbageHand([]);
        this.playersInPlay = new ItemCollection<CribbagePlayer>([]);
        this.sequence = new Sequence();
        this.hasBegun = false;
    }

    /**
     * Initialize the game.
     * - Set the game mode (team or free for all)
     * - Create the teams
     * @throws ErrorStrings.INVALID_NUMBER_OF_PLAYERS if there are too few or too many players
     */
    private initializeGame(): void {
        this.numPlayers = this.players.countItems();
        if (this.numPlayers < 2 || this.numPlayers > 6)
            throw ErrorStrings.INVALID_NUMBER_OF_PLAYERS;
        this.mode = (this.numPlayers == 4 || this.numPlayers == 6 ? Mode.Team : Mode.FFA);
        if (this.mode == Mode.Team) {
            if (this.numPlayers == 4) {
                this.teams = new Teams(new ItemCollection<CribbageTeam>([
                    new CribbageTeam(1, [this.players.itemAt(0), this.players.itemAt(2)]),
                    new CribbageTeam(2, [this.players.itemAt(1), this.players.itemAt(3)])
                ]));
            }
            else {
                this.teams = new Teams(new ItemCollection<CribbageTeam>([
                    new CribbageTeam(1, [this.players.itemAt(0), this.players.itemAt(3)]),
                    new CribbageTeam(2, [this.players.itemAt(1), this.players.itemAt(4)]),
                    new CribbageTeam(3, [this.players.itemAt(2), this.players.itemAt(5)])
                ]));
            }
        }
        else {
            // Make the teams
            if (this.teams != null) {
                this.teams.removeAll();
            }
            else {
                this.teams = new Teams<CribbagePlayer>(new ItemCollection<CribbageTeam>([]));
            }
            var id = 1;
            for (var index = 0; index < this.players.countItems(); index++, id++) {
                this.teams.addTeam(new CribbageTeam(id, [this.players.itemAt(index)]));
            }
        }
    }

    /**
     * Tells if the game is ready to begin
     * @returns {boolean} true if the game is ready to begin
     */
    isReady():boolean {
        return (this.kitty ? (this.kitty.countItems() == 4) : false);
    }

    /**
     * Begin the game.
     * - initialize the game
     * - cut for dealer
     * - deal the cards
     */
    begin():void {
        if (this.hasBegun) {
            throw ErrorStrings.GAME_HAS_ALREADY_BEGUN;
        }
        else {
            this.initializeGame();
            this.cutForDealer();
            this.deal();
            this.hasBegun = true;
        }
    }

    /**
     * The given player plays the given cards from their hand into the kitty. The game size determines how
     * many cards the player should be throwing into the kitty.
     * @param playerName
     * @param cards
     * @throws ErrorStrings.PLAYER_DOES_NOT_EXIST if the player isn't part of the game
     * @throws ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD if the player doesn't have the cards
     * @throws ErrorStrings.INVALID_NUM_CARDS_THROWN_TO_KITTY if the player throws the wrong number of cards
     * @throws ErrorStrings.INVALID_THROWER if the player cannot legally throw to the kitty
     */
    giveToKitty(playerName: string, cards: ItemCollection<Card>):CribbageReturn {
        var response = new CribbageReturn();
        var player = this.findPlayer(playerName);
        if (!player)
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        // Check that the kitty is not already full
        if (this.kitty.size() == 4)
            throw ErrorStrings.KITTY_IS_READY;
        // Check that the player has the cards they're trying to throw
        var numThrown = cards.countItems();
        for (var ix = 0; ix < numThrown; ix++) {
            var card = cards.itemAt(ix);
            if (player.hand.indexOfItem(card) == -1) {
                throw `${ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD} the ${card.toString()}!`;
            }
        }
        // Check that the right number of cards were thrown
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
        // Remove the cards from the player's hand
        for (var ix = 0; ix < numThrown; ix++) {
            player.hand.playCard(player.hand.itemAt(player.hand.indexOfItem(cards.itemAt(ix))));
        }
        // Add the cards to the kitty
        var card:Card = null;
        for (var index = 0; index < cards.countItems(); index++) {
            card = cards.itemAt(index);
            this.kitty.takeCard(card);
        }
        if (this.kitty.size() == 4) {
            // Cut the deck and allow play to begin
            this.cutTheDeck();
            if (this.cut.value == Value.Jack) {
                // Give the dealer 2 points
                if (this.findTeam(this.dealer).addPoints(this.dealer, 2)) {
                    // Game over
                    response = this.setGameOver(team);
                }
                else {
                    response.message = `2 points to ${this.dealer.name} for "His Heels" (cutting the right jack)`;
                }
            }
        }
        return response;
    }

    /**
     * The given player is playing the given card: determine if they can play the card and if so, then count
     * any points the player may have gotten from playing the card.
     * @param playerName
     * @param card
     * @returns {boolean} true if it's game over
     * @throws ErrorStrings.KITTY_NOT_READY if there are not enough cards in the kitty to begin play
     * @throws ErrorStrings.FMT_NOT_NEXT_PLAYER if the next player to play is not the one trying to play a card
     * @throws ErrorStrings.EXCEEDS_31 if the player plays a card that makes the count exceed 31
     * @throws ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD if the player doesn't have the card they're trying to play
     */
    playCard(playerName: string, card: Card):CribbageReturn {
        var response = new CribbageReturn();
        // Make sure everyone has thrown to the kitty
        if (this.kitty.size() != 4) {
            throw ErrorStrings.KITTY_NOT_READY;
        }
        // Find the player
        var player = this.findPlayer(playerName);
        if (!player.equalsOther(this.nextPlayerInSequence)) {
            throw ErrorStrings.FMT_NOT_NEXT_PLAYER + this.nextPlayerInSequence.name;
        }
        while (true) {
            var team = this.teams.findTeam(player);
            var cardValue = CribbageHand.getCardValue(card);
            if ((this.count + cardValue) > 31) {
                throw ErrorStrings.EXCEEDS_31;
            }
            if (!player.playCard(card)) {
                throw `${ErrorStrings.FMT_PLAYER_DOESNT_HAVE_CARD} the ${card.toString()}!`;
            }
            this.lastPlayerToPlay = player;
            if (player.hand.size() == 0) {
                // The player played their last card, remove them from the round of play
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
                    // The last player to play gets a point for a go
                    response.message = `${player.name} gets a point for a go`;
                    if (points > 0) {
                        response.message += ` in addition to ${points} points`;
                    }
                    if (team.addPoints(player, 1)) {
                        // Game over
                        response = this.setGameOver(team);
                        break;
                    }
                }
                else {
                    response.message = `${player.name} gets 31 for two points`;
                }
                var scores = this.roundOverResetState();
                response.message += `\n${scores}`;
                var ros = this.roundOverStr();
                response.message += `\n${ros}`;
                break;
            }
            else if (is31) {
                // Reset the sequence
                response.sequenceOver = true;
                this.resetSequence(player);
                this.setNextPlayerInSequence(player);
                break;
            }
            else if (this.playersInPlay.countItems() == 0) {
                // Give the player a point for a go
                points++;
                if (team.addPoints(player, 1)) {
                    // Game over
                    response = this.setGameOver(team);
                    break;
                }
                // Reset the sequence and set the next player
                response.sequenceOver = true;
                this.resetSequence(null);
                this.setNextPlayerInSequence(player);
                response.message += `\nThe sequence has been reset, the count is at ${this.count}.`;
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
            response.message = `${player.name} scored ${points} points.\n${response.message}`;
        }
        return response;
    }

    /**
     * The given player is the one that said "go": determine if the player can still play. If the player cannot
     * play, then determine if the round is over. If the round is over, then count the points, set the next dealer,
     * deal the cards, and start over again.
     * @param playerName the player who said "go"
     * @returns {boolean} true if it's game over, false if the game is not over
     * @throws ErrorStrings.PLAYER_DOES_NOT_EXIST if the player is not part of the current game
     * @throws ErrorStrings.PLAYER_CAN_PLAY if the player has a card that they can still play
     */
    go(playerName: string):CribbageReturn {
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
            // The go is valid, remove the player from play
            this.playersInPlay.removeItem(player);
        }
        if (this.playersInPlay.countItems() == 0) {
            // No more players in play, the last player to play a point for a go
            var team = this.findTeam(this.lastPlayerToPlay);
            response.message = `${this.lastPlayerToPlay.name} gets a point for a go.`;
            if (team.addPoints(this.lastPlayerToPlay, 1)) {
                // Game over
                response = this.setGameOver(team);
            }
            else if (this.roundOver()) {
                response.roundOver = true;
                this.roundOverResetState();
                response.message += ` ${this.roundOverStr()}`;
            }
            else {
                // Start the sequence over again, with the person after the one that got the go
                this.resetSequence(player);
                this.setNextPlayerInSequence(player);
                response.message += `\nThe count is back at 0.\nYou're up ${this.nextPlayerInSequence.name}`;
            }
        }
        else {
            this.setNextPlayerInSequence(player);
        }
        return response;
    }

    /**
     * Add a player to the current game
     * @param player the player to add
     * @throws ErrorStrings.PLAYER_ALREADY_IN_GAME if the player is already in the game
     */
    addPlayer(player:CribbagePlayer):void {
        if (this.findPlayer(player.name)) {
            throw ErrorStrings.PLAYER_ALREADY_IN_GAME;
        }
        else if (this.hasBegun) {
            throw ErrorStrings.GAME_HAS_ALREADY_BEGUN;
        }
        else {
            this.players.addPlayer(player);
        }
    }

    /**
     * Describe the current state of the game
     * @returns {string}
     */
    describe():string {
        var scores = "";
        if (this.teams) {
            scores = this.printScores();
        }
        var players = [];
        for (var jx = 0; jx < this.players.countItems(); jx++) {
            players.push(this.players.itemAt(jx).name);
        }
        return JSON.stringify(new CribbageGameDescription(
            (this.dealer ? this.dealer.name : ""),
            (this.nextPlayerInSequence ? this.nextPlayerInSequence.name : ""),
            (this.cut ? this.cut.toString() : ""),
            this.count,
            this.sequence.toString(),
            scores,
            players
        ));
    }

    /**
     * Find the given player and return their hand as a string
     * @param playerName
     * @returns {string} the string representation of the player's hand
     * @throws ErrorStrings.PLAYER_DOES_NOT_EXIST if the player does not exist
     */
    getPlayerHandStr(playerName:string): string {
        var hand = "";
        var player = this.findPlayer(playerName);
        if (player != null) {
            hand = this.printHand(<CribbageHand>player.hand);
        }
        else {
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        }
        return hand;
    }

    getPlayerHand(playerName:string): CribbageHand {
        var hand:CribbageHand = null;
        var player = this.findPlayer(playerName);
        if (player != null) {
            hand = <CribbageHand>player.hand;
        }
        else {
            throw ErrorStrings.PLAYER_DOES_NOT_EXIST;
        }
        return hand;
    }

    private setGameOver(winningTeam: CribbageTeam):CribbageReturn {
        this.winningTeam = winningTeam;
        return new CribbageReturn(
            true,
            `${MessageStrings.GAME_OVER} Winning team: ${this.winningTeam.printTeam()}`
        );
    }

    private printScores():string {
        var scores = "";
        if (this.teams) {
            for (var ix = 0; ix < this.teams.numTeams(); ix++) {
                scores += "{ ";
                var team = <CribbageTeam>this.teams.teams.itemAt(ix);
                for (var jx = 0; jx < team.numPlayers(); jx++) {
                    scores += (team.itemAt(jx).name + ", ");
                }
                scores = removeLastTwoChars(scores);
                scores += (" = " + team.countPoints() + " }, ");
            }
            scores = removeLastTwoChars(scores);
        }
        return scores;
    }

    private printHand(hand:CribbageHand):string {
        var handStr = "";
        hand.sortCards();
        for (var ix = 0; ix < hand.size(); ix++) {
            handStr += `${hand.itemAt(ix).toString()}, `;
        }
        return removeLastTwoChars(handStr);
    }

    /**
     * Find the player with the given name
     * @param playerName
     * @returns {CribbagePlayer}
     */
    private findPlayer(playerName: string):CribbagePlayer {
        var player = null;
        var match = new CribbagePlayer(playerName, new CribbageHand([]));
        for (var index = 0; index < this.players.countItems(); index++) {
            var tmp = this.players.itemAt(index);
            if (tmp.equalsOther(match)) {
                player = tmp;
                break;
            }
        }
        return player;
    }

    printPlayers():string {
        var players = "";
        for (var jx = 0; jx < this.players.countItems(); jx++) {
            players += `${this.players.itemAt(jx).name}, `;
        }
        return removeLastTwoChars(players);
    }

    /**
     * Format a string to return to the channel when the round is over
     * @returns {string}
     */
    private roundOverStr():string {
        return `Round over.\n`+
        `The cards have been shuffled and dealt.\n`+
        `Throw to ${this.dealer.name}'s kitty!\n`+
        `Scores: ${this.printScores()}`;
    }

    /**
     * Function to reset the state of the game when the round is over
     * @returns {string} the list of players hands and their scores
     */
    private roundOverResetState():string {
        console.log("roundOverResetStates counting points");
        var scores = this.countPoints().message;
        console.log("resetting the cut and last player to play");
        this.cut = null;
        this.lastPlayerToPlay = null;
        console.log("roundOverResetStates setting next dealer");
        this.setNextDealer();
        console.log("roundOverResetStates dealing");
        this.deal();
        console.log(`roundOverResetStates returning ${scores}`);
        return scores;
    }

    /**
     * Determine if the round is over by seeing if any of the players in play have cards left to play
     * @returns {boolean}
     */
    private roundOver():boolean {
        var done = true;
        for (var index = 0; index < this.players.countItems(); index++) {
            if (this.players.itemAt(index).hand.size() > 0) {
                done = false;
                break;
            }
        }
        return done;
    }

    /**
     * Sum up the points for each team
     * @returns {CribbageReturn}
     */
    private countPoints():CribbageReturn {
        var ret = new CribbageReturn(false, `The cut card is the ${this.cut}`);
        var firstPlayer = this.nextPlayerInOrder(this.dealer);
        var countingPlayer = firstPlayer;
        do {
            var team = this.findTeam(countingPlayer);
            var points = countingPlayer.countPoints(this.cut);
            if (team.addPoints(countingPlayer, points)) {
                // Game over
                ret = this.setGameOver(team);
                break;
            }
            ret.message += `\n${countingPlayer.name} has hand ${this.printHand(<CribbageHand>countingPlayer.hand)} and scored ${points} points.`;
            if (this.dealer.equalsOther(countingPlayer)) {
                // Add the kitty up
                points = this.kitty.countPoints(this.cut, true);
                this.kitty.playCard(this.cut);
                if (team.addPoints(countingPlayer, points)) {
                    // Game over
                    ret = this.setGameOver(team);
                    break;
                }
                ret.message += `\nThe kitty is ${this.printHand(this.kitty)} and scores ${points} points.`;
            }
            countingPlayer = this.nextPlayerInOrder(countingPlayer);
        }
        while (!countingPlayer.equalsOther(firstPlayer));
        return ret;
    }

    /**
     * Set the dealer and next player in sequence
     */
    private cutForDealer():void {
        var lowest = null;
        console.log("Cribbage cutForDealer");
        for (var index = 0; index < this.numPlayers; index++) {
            console.log("cutForDealer about to random draw");
            var card = this.deck.randomDraw(false);
            console.log(`cutForDealer drew the ${card.toString()}`);
            if (lowest == null || card.value < lowest.value) {
                lowest = card;
                this.dealer = this.players.itemAt(index);
            }
        }
        this.nextPlayerInSequence = this.nextPlayerInOrder(this.dealer);
    }

    /**
     * Remove the cards from each players hand
     */
    private resetHands():void {
        for (var index = 0; index < this.numPlayers; index++) {
            this.players.itemAt(index).hand.removeAll();
        }
    }

    /**
     * deal() assumes that the dealer and next player are already set.
     * - remove all cards from the previous run of play
     * - reset the hands
     * - shuffle the cards
     * - add the players back to the run of play
     * - deal the cards
     */
    private deal():void {
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
    }

    /**
     * Set the next player to play a card. If a player is given, then the game's next player to play a card will be
     * the next player after the given player.
     * @param {CribbagePlayer} player if given, then set the next player to be the next one after this given player,
     * otherwise just set the next player as the next valid one in sequence.
     * @returns {any}
     */
    private setNextPlayerInSequence(player:CribbagePlayer):void {
        if (player != null) {
            if (this.nextPlayerInSequence.equalsOther(player) || this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1) {
                // The next player in the sequence can no longer play, set the next one
                do {
                    this.nextPlayerInSequence = this.nextPlayerInOrder(this.nextPlayerInSequence);
                }
                while (this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1);
            }
        }
        else if (this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1) {
                // The next player in the sequence can no longer play, set the next one
                do {
                    this.nextPlayerInSequence = this.nextPlayerInOrder(this.nextPlayerInSequence);
                }
                while (this.playersInPlay.indexOfItem(this.nextPlayerInSequence) == -1);
        }
    }

    /**
     * Reset the sequence
     * @param {CribbagePlayer} player the player who ended the sequence.
     * If null, then set the next player in the sequence is not set.
     */
    private resetSequence(player:CribbagePlayer):void {
        this.count = 0;
        this.lastPlayerToPlay = null;
        this.sequence.removeAll();
        this.playersInPlay.removeAll();
        // Add back the players who have cards in their hands
        for (var ix = 0; ix < this.numPlayers; ix++) {
            var cribPlayer = this.players.itemAt(ix);
            if (cribPlayer.hand.size() > 0) {
                this.playersInPlay.addItem(cribPlayer);
            }
        }
        if (player != null) {
            this.nextPlayerInSequence = this.nextPlayerInOrder(player);
        }
    }

    /**
     * Select a random card (without replacement) as the cut card
     */
    private cutTheDeck() {
        this.cut = this.deck.randomDraw(false);
    }

    /**
     * Draw a card from the deck
     * @returns {BaseCard}
     */
    private draw():Card {
        return this.deck.draw();
    }

    /**
     * Deal the cards for a two player game
     */
    private dealForTwo():void {
        var player = this.nextPlayerInOrder(this.dealer);
        while (player.numCards() < 6) {
            var card = this.draw();
            player.hand.takeCard(card);
            player = this.nextPlayerInOrder(player);
        }
    }
    /**
     * Deal the cards for a three player game
     */
    private dealForThree():void {
        var player = this.nextPlayerInOrder(this.dealer);
        while (player.numCards() < 5) {
            player.takeCard(this.draw());
            player = this.nextPlayerInOrder(player);
        }
        if (this.kitty == null) {
            this.kitty = new CribbageHand([]);
        }
        this.kitty.takeCard(this.draw());
    }
    /**
     * Deal the cards for a four player game
     */
    private dealForFour():void {
        var player = this.nextPlayerInOrder(this.dealer);
        while (player.numCards() < 5) {
            player.takeCard(this.draw());
            player = this.nextPlayerInOrder(player);
        }
    }
    /**
     * Deal the cards for a five player game
     */
    private dealForFive():void {
        throw "Not Implemented!";
    }
    /**
     * Deal the cards for a six player game
     */
    private dealForSix():void {
        var player = this.nextPlayerInOrder(this.dealer);
        var dealingTeam = this.findTeam(this.dealer);
        while (player.numCards() < 5) {
            if (!(player.equalsOther(this.dealer) || dealingTeam.equalsOther(this.findTeam(player)))) {
                player.takeCard(this.draw());
            }
        }
    }

    /**
     * Set the dealer and next player to play a card
     */
    private setNextDealer():void {
        this.dealer = this.nextPlayerInOrder(this.dealer);
        this.nextPlayerInSequence = this.nextPlayerInOrder(this.dealer);
    }

    /**
     * Find the next player in order
     * @param {CribbagePlayer} player the current player
     * @returns {CribbagePlayer} the next player
     */
    private nextPlayerInOrder(player: CribbagePlayer):CribbagePlayer {
        var index = this.players.indexOfItem(player);
        if ((index + 1) >= this.numPlayers) {
            index = 0;
        }
        else {
            index++;
        }
        return this.players.itemAt(index);
    }

    /**
     * Find the team that the given player belongs to
     * @param player
     * @returns {CribbageTeam} the team the player belongs to
     */
    private findTeam(player: CribbagePlayer):CribbageTeam {
        var team = null;
        for (var index = 0; index < this.teams.numTeams(); index++) {
            var t = this.getTeam(index);
            if (t.hasPlayer(player)) {
                team = t;
                break;
            }
        }
        return team;
    }
}
