import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import GameHistory from './game_history';
import Player from './player';

@Table
export default class WinLossHistory extends Model<WinLossHistory> {
    /**
     * The ID of the player
     */
    @ForeignKey(() => Player)
    @Column
    playerId: number;

    /**
     * The ID of the game history
     */
    @ForeignKey(() => GameHistory)
    @Column
    gameHistoryId: number;

    /**
     * true = won, false = lost
     */
    @Column
    won: boolean;
}
