import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import GameHistory from './game_history';
import Player from './player';
import Team from './team';

/**
 * Pivot table that associates a game history with a player
 */
@Table
export default class GameHistoryPlayer extends Model<GameHistoryPlayer> {
    /**
     * The ID of the game history
     */
    @ForeignKey(() => GameHistory)
    @Column
    gameHistoryId: number;

    /**
     * The ID of the player
     */
    @ForeignKey(() => Player)
    @Column
    playerId: number;

    /**
     * The ID of the team the player played on
     */
    @ForeignKey(() => Team)
    @Column
    teamId: number;
}
