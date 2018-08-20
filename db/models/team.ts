import { Column, Model, Table, Unique } from 'sequelize-typescript';

@Table
export default class Team extends Model<Team> {
    /**
     * The name of the team, i.e. red, blue, green (the color of the pegs)
     */
    @Column({unique: true})
    name: string;
}
