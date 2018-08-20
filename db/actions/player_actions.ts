import Player from '../models/player';

class Actions {
    findById(id: number) {
        return Player.findOne({
            where: { id }
        });
    }

    findByName(name: string) {
        return Player.findOne({
            where: { name }
        });
    }

    create(name: string) {
        return Player.create({ name });
    }
}
export const PlayerActions = new Actions();
