import { Game } from '../models/game';

class Actions {
    findByName(name: string) {
        return Game.findOne({
            where: { name }
        });
    }
    create(name: string) {
        return Game.create({
            name
        });
    }
}
export const GameActions = new Actions();
