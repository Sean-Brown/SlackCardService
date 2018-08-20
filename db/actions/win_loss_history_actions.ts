import Player from '../models/player';
import WinLossHistory from '../models/win_loss_history';

class Actions {
    async get(playerName: string) {
        const player = await Player.findOne({
            attributes: ['id'],
            where: {
                name: playerName
            }
        });
        return WinLossHistory.findAll({
            where: {
                playerId: player.id
            }
        });
    }
}
export const WinLossHistoryActions = new Actions();
