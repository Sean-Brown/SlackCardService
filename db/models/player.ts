import { BelongsToMany, Column, CreatedAt, Model, Table, Unique } from 'sequelize-typescript';
import { GameHistory } from './game_history';
import { GameHistoryPlayer } from './game_history_player';

@Table({
    updatedAt: false,
    underscored: true,
    underscoredAll: true
})
export class Player extends Model<Player> {

    /**
     * The name of the player.
     */
    @Column
    @Unique
    name: string;

    /**
     * The date the player joined
     */
    @CreatedAt
    joined: Date;

    /**
     * The player's list of games they've been in
     */
    @BelongsToMany(() => GameHistory, () => GameHistoryPlayer)
    gameHistory?: GameHistory[];
}
