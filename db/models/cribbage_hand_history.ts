import { Column, CreatedAt, ForeignKey, Model, Table } from 'sequelize-typescript';
import { GameHistory } from './game_history';
import { Player } from './player';

@Table({
    updatedAt: false,
    underscored: true,
    underscoredAll: true
})
export class CribbageHandHistory extends Model<CribbageHandHistory> {
    /**
     * The ID of the player this hand is for
     */
    @ForeignKey(() => Player)
    playerId: number;

    /**
     *  The ID of the game this hand was in
     */
    @ForeignKey(() => GameHistory)
    gameHistoryId: number;

    /**
     * The player's hand EXCLUDING the cut card
     * This is a hyphen-delimited shorthand form of the hand, e.g.
     * 7h-3s-10c-kh-qd for 'seven of hearts'-'three of spades'-
     * 'ten of clubs'-'king of hearts'-'queen of diamonds'
     */
    @Column
    hand: string;

    /**
     * The date this hand was received
     */
    @CreatedAt
    received: Date;

    /**
     * The cut card in short form, e.g. 5c for 'five of clubs'
     */
    @Column
    cut: string;

    /**
     * True = the hand is somebody's crib, false (default) is a normal hand
     */
    @Column({ defaultValue: false })
    isCrib: boolean;

    /**
     * True = the hand was played to the end of the round
     * This is useful for determining where to start when resuming a game
     */
    @Column({ defaultValue: false })
    played: boolean;

    /**
     * The number of points the player has so far
     */
    @Column({ defaultValue: 0 })
    points: number;
}
