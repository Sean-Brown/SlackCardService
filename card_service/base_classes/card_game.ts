import {IItem} from '../interfaces/iitem';
import {BaseDeck as Deck} from './collections/deck';
import {ItemCollection} from './collections/item_collection';
import {BaseTeam as Team} from './collections/team';
import {BaseCard as Card} from './items/card';
import {BasePlayer as Player} from './items/player';

export function removeLastTwoChars(str: string): string {
    let ret = '';
    const len = str.length;
    if (len === 1) {
        ret = str.substring(0);
    }
    else if (len > 1) {
        ret = str.substring(0, len - 2);
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
        let player = null;
        for (let index = 0; index < this.countItems(); index++) {
            const tmp = this.itemAt(index);
            if (tmp.name === playerName) {
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
        let team = null;
        let hasPlayer = false;
        for (let ix = 0; ix < this.teams.countItems(); ix++) {
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
        const index = this.cards.indexOfItem(card);
        // Assert index == -1
        if (index !== -1) {
            throw 'Attempting to add a card that\'s already in the sequence!';
        }
        this.cards.addItem(card);
        return this.countPoints();
    }

    addCards(cards: Array<Card>) {
        for (let index = 0; index < cards.length; index++) {
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
        let ret = '';
        for (let ix = 0; ix < this.cards.countItems(); ix++) {
            ret += (this.cards.itemAt(ix).toString() + ', ');
        }
        ret = removeLastTwoChars(ret);
        return ret;
    }

    equalsOther(other: Sequence): boolean {
        if (this.cards.countItems() !== other.cards.countItems()) {
            return false;
        }
        let equals = true;
        for (let ix = 0; ix < this.cards.countItems(); ix++) {
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
        let sequential = true;
        let last = -1;
        array.sort((n1, n2) => {
            return n1 - n2;
        });
        for (let ix = 0; ix < array.length; ix++) {
            if (last === -1) {
                last = array[ix];
                continue;
            }
            const next = array[ix];
            if (last !== (next - 1)) {
                sequential = false;
                break;
            }
            last = next;
        }
        return sequential;
    }

    private findLongestReverseSequence() {
        const numItems = this.cards.countItems();
        if (numItems < 3) {
            return 0;
        }
        // Start at the back, sort the values, if there is a numerical run of 3 or more, then it is a run
        const values = [];
        let longest = 0;
        for (let ix = numItems - 1; ix >= 0; ix--) {
            values.push(this.cards.itemAt(ix).value);
            if (Sequence.isSequentialAscending(values)) {
                longest = values.length;
            }
        }
        return (longest >= 3 ? longest : 0);
    }

    private countOfAKind() {
        let matches = 0;
        let index = (this.cards.countItems() - 1);
        const match = this.cards.itemAt(index);
        index--;
        for (; index >= 0; index--) {
            if (this.cards.itemAt(index).value === match.value) {
                matches++;
            }
            else {
                break;
            }
        }
        return (matches === 1 ? 2 : matches === 2 ? 6 : matches === 3 ? 12 : 0);
    }
}

export class BaseCardGame<SomePlayerClass extends Player, SomeDeckClass extends Deck<Card>> {
    players: Players<SomePlayerClass>;
    teams: Teams<SomePlayerClass>;
    name: string;
    deck: SomeDeckClass;

    constructor(players: Players<SomePlayerClass>, teams: Teams<SomePlayerClass>, name: string, deck: SomeDeckClass) {
        this.players = players;
        this.teams = teams;
        this.name = name;
        this.deck = deck;
    }

    shuffle() {
        this.deck.shuffle();
    }

    getTeam(index: number) {
        return this.teams.teams.itemAt(index);
    }
}
