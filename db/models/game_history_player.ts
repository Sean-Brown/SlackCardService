import { ForeignKey, Model, Table } from 'sequelize-typescript';
import { GameHistory } from './game_history';
import { Player } from './player';
import { Team } from './team';

/**
 * Pivot table that associates a game history with a player
 */
@Table({
    underscored: true,
    underscoredAll: true
})
export class GameHistoryPlayer extends Model<GameHistoryPlayer> {
    /**
     * The ID of the game history
     */
    @ForeignKey(() => GameHistory)
    gameHistoryId: number;

    /**
     * The ID of the player
     */
    @ForeignKey(() => Player)
    playerId: number;

    /**
     * The ID of the team the player played on
     */
    @ForeignKey(() => Team)
    teamId: number;
}
