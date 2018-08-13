import {removeLastTwoChars} from '../base_classes/card_game';
import {BaseTeam} from '../base_classes/collections/team';
import {CribbagePlayer} from './cribbage_player';

export class CribbageTeamErrorStrings {
    static PLAYER_NOT_ON_TEAM = 'Player not on this team!';
}
export class CribbageTeam extends BaseTeam<CribbagePlayer> {
    constructor(id: number, players: Array<CribbagePlayer>) {
        super(id, players);
    }

    countPoints() {
        let points = 0;
        for (let index = 0; index < this.countItems(); index++) {
            points += this.itemAt(index).points;
        }
        return points;
    }

    /**
     * Add points to the given player.
     * @param player
     * @param points
     * @returns {boolean} true if it's game over
     */
    addPoints(player: CribbagePlayer, points: number): boolean {
        const index = this.indexOfItem(player);
        if (index === -1) {
            throw CribbageTeamErrorStrings.PLAYER_NOT_ON_TEAM;
        }
        this.itemAt(index).addPoints(points);
        return (this.countPoints() > 120);
    }

    hasPlayer(player: CribbagePlayer): boolean {
        return (this.indexOfItem(player) !== -1);
    }

    numPlayers(): number {
        return this.countItems();
    }

    printTeam(): string {
        let team = '';
        for (let ix = 0; ix < this.numPlayers(); ix++) {
            team += `${this.itemAt(ix).name}, `;
        }
        return removeLastTwoChars(team);
    }
}
