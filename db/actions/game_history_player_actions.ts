import { GameHistoryPlayer } from '../models/game_history_player';
import { Player } from '../models/player';

class Actions {
    createAssociations(gameHistoryId: number, playerIds: number[]) {
        const instances = [];
        for (const playerId in playerIds) {
            instances.push({
                gameHistoryId,
                playerId
            });
        }
        return GameHistoryPlayer.bulkCreate(instances);
    }
    findAssociation(gameHistoryId: number, playerId: number) {
        return GameHistoryPlayer.findOne({
            where: {
                gameHistoryId,
                playerId
            }
        });
    }
    async getGamePlayers(gameHistoryId: number) {
        const playerIds = await GameHistoryPlayer.findAll({
            attributes: ['player_id'],
            where: {
                gameHistoryId
            }
        }).map((ghp: GameHistoryPlayer) => ghp.playerId);
        return Player.findAll({
            where: {
                id: {
                    $in: playerIds
                }
            }
        });
    }
}
export const GameHistoryPlayerActions = new Actions();
