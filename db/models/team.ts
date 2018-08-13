import { Column, Model, Table, Unique } from 'sequelize-typescript';

@Table({
    underscored: true,
    underscoredAll: true
})
export class Team extends Model<Team> {
    /**
     * The name of the team, i.e. red, blue, green (the color of the pegs)
     */
    @Column
    @Unique
    name: string;
}
