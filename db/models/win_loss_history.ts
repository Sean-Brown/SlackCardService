import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { GameHistory } from './game_history';
import { Player } from './player';

@Table({
    underscored: true,
    underscoredAll: true
})
export class WinLossHistory extends Model<WinLossHistory> {
    /**
     * The ID of the player
     */
    @ForeignKey(() => Player)
    playerId: number;

    /**
     * The ID of the game history
     */
    @ForeignKey(() => GameHistory)
    gameHistoryId: number;

    /**
     * true = won, false = lost
     */
    @Column
    won: boolean;
}
