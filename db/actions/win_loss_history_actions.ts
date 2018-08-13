import { Player } from '../models/player';
import { WinLossHistory } from '../models/win_loss_history';

class Actions {
    get(playerName: string) {
        return WinLossHistory.findAll({
            include: [{
                model: Player,
                where: { name: playerName }
            }]
        });
    }
}
export const WinLossHistoryActions = new Actions();
