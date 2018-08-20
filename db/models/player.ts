import { BelongsToMany, Column, CreatedAt, HasMany, Model, Table } from 'sequelize-typescript';
import GameHistory from './game_history';
import GameHistoryPlayer from './game_history_player';
import WinLossHistory from './win_loss_history';

@Table({
    updatedAt: false
})
export default class Player extends Model<Player> {

    /**
     * The name of the player.
     */
    @Column({unique: true})
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

    /**
     * The player's win-loss history
     */
    @HasMany(() => WinLossHistory)
    winsAndLosses: WinLossHistory[];
}
