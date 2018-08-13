import { Column, Model, Table, Unique } from 'sequelize-typescript';

@Table({
    underscored: true,
    underscoredAll: true
})
export class Game extends Model<Game> {
    /**
     * The name of the game, e.g. Cribbage
     */
    @Column
    @Unique
    name: string;
}
