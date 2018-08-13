import { Column, CreatedAt, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Game } from './game';

@Table({
    updatedAt: false,
    underscored: true,
    underscoredAll: true
})
export class GameHistory extends Model<GameHistory> {
    /**
     * The ID of the game
     */
    @ForeignKey(() => Game)
    gameId: number;

    /**
     * When the game began
     */
    @CreatedAt
    began: Date;

    /**
     * When the game ended
     */
    @Column
    ended: Date;
}
