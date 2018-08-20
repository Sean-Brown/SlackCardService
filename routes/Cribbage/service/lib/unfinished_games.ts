import { Manager as DbManager } from '../../../../db/manager';
import GameHistory from '../../../../db/models/game_history';
import GameHistoryPlayer from '../../../../db/models/game_history_player';
import WinLossHistory from '../../../../db/models/win_loss_history';

import { Sequelize } from 'sequelize-typescript';
const Op = Sequelize.Op;

export class UnfinishedGames {
    /**
     * The a set of the unfinished game-history IDs
     */
    private unfinishedGames: Set<number>;

    constructor() {
        this.unfinishedGames = new Set();
    }

    /**
     * Find out if the given game is unfinished
     * @param gameHistoryId
     * @returns {boolean}
     */
    public async isUnfinished(gameHistoryId: number): Promise<boolean> {
        const isUnfinished = this.unfinishedGames.has(gameHistoryId);
        if (!isUnfinished) {
            // Check in the database
            const result = await WinLossHistory.findOne({
                attributes: ['gameHistoryId'],
                where: { gameHistoryId }
            });
            if (result) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return isUnfinished;
        }
    }

    /**
     * Add the game to the set of unfinished games
     * @param gameHistoryID
     */
    public addUnfinishedGame(gameHistoryID: number): void {
        if (!this.unfinishedGames.has(gameHistoryID)) {
            this.unfinishedGames.add(gameHistoryID);
        }
    }

    /**
     * Get the number of unfinished games
     * @returns {number}
     */
    public countUnfinishedGames() {
        return this.unfinishedGames.size;
    }

    /**
     * Run a query returning the IDs of the all the unfinished game-history rows
     * @returns {Promise<Array<number>>}
     */
    public async getUnfinishedGames(): Promise<Array<number>> {
        let gameHistoryIDs = [];
        try {
            const winLossGameHistoryIDs = await WinLossHistory.findAll({
                attributes: ['gameHistoryId']
            }).map((wlh: WinLossHistory) => wlh.gameHistoryId);
            gameHistoryIDs = await GameHistory.findAll({
                attributes: ['id'],
                where: {
                    id: {
                        [Op.in]: winLossGameHistoryIDs
                    }
                }
            }).map((gh: GameHistory) => gh.id)
            .each((ghid: number) => {
                this.addUnfinishedGame(ghid);
            });
        }
        catch (e) {
            console.log(`error getting the unfinished games`, e);
        }
        return gameHistoryIDs;
    }

    public async playerUnfinishedGames(playerId: number): Promise<Array<number>> {
        let gameHistoryIDs = [];
        try {
            const winLossGameHistoryIds = await WinLossHistory.findAll({
                attributes: ['gameHistoryId'],
                distinct: true
            }).map((wlh: WinLossHistory) => wlh.gameHistoryId);
            gameHistoryIDs = await GameHistoryPlayer.findAll({
                attributes: ['gameHistoryId'],
                where: {
                    playerId,
                    id: {
                        [Op.in]: winLossGameHistoryIds
                    }
                }
            }).map((ghp: GameHistoryPlayer) => ghp.gameHistoryId)
            .each((ghid: number) => {
                this.addUnfinishedGame(ghid);
            });
        }
        catch (e) {
            console.log(`error getting the unfinished games for player ${playerId}`, e);
        }
        return gameHistoryIDs;
    }
}
