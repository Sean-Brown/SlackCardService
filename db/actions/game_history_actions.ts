import { Sequelize } from '../../node_modules/sequelize-typescript';
import GameHistory from '../models/game_history';
import GameHistoryPlayer from '../models/game_history_player';
import Player from '../models/player';

class Actions {
    create(gameId: number) {
        return GameHistory.create({
            gameId
        });
    }
    findMostRecent(gameId: number) {
        return GameHistory.findOne({
            where: {
                gameId,
                ended: null
            },
            order: [['id', 'DESC']]
        });
    }
    endGame(gameHistoryId: number) {
        return GameHistory.update(
            {
                ended: true
            },
            {
                where: { gameHistoryId }
            }
        );
    }
    async find(gameId: number, playerName: string) {
        const gameHistories = await GameHistory.findAll({
            attributes: ['id'],
            where: {
                gameId
            }
        }).map((gh: GameHistory) => gh.id);
        const player = await Player.findOne({
            attributes: ['id'],
            where: {
                name: playerName
            }
        });
        return GameHistoryPlayer.findAll({
            where: {
                gameHistoryId: {
                    [Sequelize.Op.in]: gameHistories
                },
                playerId: player.id
            },
            order: [['id', 'DESC']]
        });
    }
}
export const GameHistoryActions = new Actions();
