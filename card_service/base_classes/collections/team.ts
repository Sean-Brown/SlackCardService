import {IItem} from '../../interfaces/iitem';
import {BasePlayer as Player} from '../items/player';
import {ItemCollection} from './item_collection';

export class BaseTeam<SomePlayerClass extends Player> extends ItemCollection<SomePlayerClass> implements IItem {
    id: number;

    constructor(id: number, players: Array<SomePlayerClass>) {
        super(players);
        this.id = id;
    }

    countPlayers(): number {
        return this.countItems();
    }

    playerAt(index: number): SomePlayerClass {
        return this.itemAt(index);
    }

    hasPlayer(player: SomePlayerClass) {
        return (this.indexOfItem(player) !== -1);
    }

    equalsOther(team: BaseTeam<SomePlayerClass>) {
        return this.id === team.id;
    }
}
