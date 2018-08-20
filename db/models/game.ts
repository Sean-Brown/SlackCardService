import { Column, Model, Table } from 'sequelize-typescript';

@Table
export default class Game extends Model<Game> {
    @Column({unique: true})
    name: string;
}
