import { Column, CreatedAt, ForeignKey, Model, Table } from 'sequelize-typescript';
import Game from './Game';

@Table({
    updatedAt: false
})
export default class GameHistory extends Model<GameHistory> {
    /**
     * The ID of the game
     */
    @ForeignKey(() => Game)
    @Column
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
