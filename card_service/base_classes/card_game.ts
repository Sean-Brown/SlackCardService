/// <reference path="items/card.ts" />
/// <reference path="items/player.ts" />
/// <reference path="collections/team.ts" />
/// <reference path="collections/deck.ts" />
/// <reference path="collections/item_collection.ts" />

import {BaseCard as Card} from "./items/card";
import {BasePlayer as Player} from "./items/player";
import {BaseTeam as Team} from "./collections/team";
import {BaseDeck as Deck} from "./collections/deck";
import {ItemCollection} from "./collections/item_collection";
import {IItem} from "../interfaces/iitem";

"use strict";

export function removeLastTwoChars(str:string): string {
    var ret = "";
    var len = str.length;
    if (len == 1) {
        ret = str.substring(0);
    }
    else if (len > 1) {
        ret = str.substring(0, len - 2)
    }
    return ret;
}

export class Players<SomePlayerClass extends Player> extends ItemCollection<SomePlayerClass> {
    constructor(players: Array<SomePlayerClass>) {
        super(players);
    }
    addPlayer(player: SomePlayerClass) {
        this.addItem(player);
    }
    findPlayer(playerName: string) {
        var player = null;
        for (var index = 0; index < this.countItems(); index++) {
            var tmp = this.itemAt(index);
            if (tmp.name == playerName) {
                player = tmp;
                break;
            }
        }
        return player;
    }
}

export class Teams<SomePlayerClass extends Player> {
    teams: ItemCollection<Team<SomePlayerClass>>;
    constructor(teams: ItemCollection<Team<SomePlayerClass>>) {
        this.teams = teams;
    }
    findTeam(player: SomePlayerClass) {
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
    }
    removeAll() {
        this.teams.removeAll();
    }
    addTeam(team: Team<SomePlayerClass>) {
        this.teams.addItem(team);
    }
    numTeams() {
        return this.teams.countItems();
    }
}

export class Sequence implements IItem {
    cards: ItemCollection<Card>;
    constructor() {
        this.cards = new ItemCollection<Card>([]);
    }
    addCard(card: Card) {
        var index = this.cards.indexOfItem(card);
        // Assert index == -1
        if (index != -1) {
            throw "Attempting to add a card that's already in the sequence!";
        }
        this.cards.addItem(card);
        return this.countPoints();
    }
    addCards(cards: Array<Card>) {
        for (var index = 0; index < cards.length; index++) {
            this.addCard(cards[index]);
        }
    }
    length() {
        return this.cards.countItems();
    }
    countPoints() {
        return this.findLongestReverseSequence() + this.countOfAKind();
    }
    removeAll() {
        this.cards.removeAll();
    }
    toString() {
        var ret = '';
        for (var ix = 0; ix < this.cards.countItems(); ix++) {
            ret += (this.cards.itemAt(ix).toString() + ', ');
        }
        ret = removeLastTwoChars(ret);
        return ret;
    }
    equalsOther(other: Sequence):boolean {
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
    }
    static isSequentialAscending(array: Array<number>) {
        if (array.length < 3) {
            return true;
        }
        var sequential = true;
        var last = -1;
        array.sort((n1, n2) => { return n1 - n2; });
        for (var ix = 0; ix < array.length; ix++) {
            if (last == -1) {
                last = array[ix];
                continue;
            }
            var next = array[ix];
            if (last != (next-1)) {
                sequential = false;
                break;
            }
            last = next;
        }
        return sequential;
    }
    private findLongestReverseSequence() {
        var numItems = this.cards.countItems();
        if (numItems < 3) {
            return 0;
        }
        // Start at the back, sort the values, if there is a numerical run of 3 or more, then it is a run
        var values = [];
        var longest = 0;
        for (var ix = numItems - 1; ix >= 0; ix--) {
            values.push(this.cards.itemAt(ix).value);
            if (Sequence.isSequentialAscending(values)) {
                longest = values.length;
            }
        }
        return (longest >= 3 ? longest : 0);
    }
    private countOfAKind() {
        var matches = 0;
        var index = (this.cards.countItems() - 1);
        var match = this.cards.itemAt(index);
        index--;
        for (; index >= 0; index--) {
            if (this.cards.itemAt(index).value == match.value) {
                matches++;
            }
            else {
                break;
            }
        }
        return (matches == 1 ? 2 : matches == 2 ? 6 : matches == 3 ? 12 : 0);
    }
}

export class BaseCardGame<SomePlayerClass extends Player, SomeDeckClass extends Deck<Card>> {
    players: Players<SomePlayerClass>;
    teams: Teams<SomePlayerClass>;
    name: string;
    deck: SomeDeckClass;
    constructor(players: Players<SomePlayerClass>, teams: Teams<SomePlayerClass>, name: string, deck: SomeDeckClass) {
        this.players = players; this.teams = teams; this.name = name; this.deck = deck;
    }
    shuffle() {
        this.deck.shuffle();
    }
    getTeam(index: number) { return this.teams.teams.itemAt(index); }
}
