import CribbageHandHistory from '../models/cribbage_hand_history';

class Actions {
    remove(gameHistoryId: number) {
        return CribbageHandHistory.destroy({
            where: { gameHistoryId }
        });
    }
    getPoints(gameHistoryId: number, playerId: number) {
        return CribbageHandHistory.findOne({
            attributes: ['points'],
            where: { gameHistoryId }
        });
    }
    getLastHand(gameHistoryId: number, playerId: number) {
        return CribbageHandHistory.findOne({
            attributes: ['hand'],
            where: {
                gameHistoryId,
                playerId
            }
        });
    }
    async hasUnplayedHands(gameHistoryId: number) {
        const result = await CribbageHandHistory.count({
            where: {
                gameHistoryId,
                played: false
            }
        });
        return (result > 0);
    }
    all(gameHistoryId: number, playerId: number) {
        return CribbageHandHistory.findAll({
            where: {
                gameHistoryId,
                playerId
            }
        });
    }
}
export const CribbageHandHistoryActions = new Actions();
