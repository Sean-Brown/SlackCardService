import { Manager as DbManager } from '../../../../db/manager';
import { GameHistory } from '../../../../db/models/game_history';
import { GameHistoryPlayer } from '../../../../db/models/game_history_player';
import { WinLossHistory } from '../../../../db/models/win_loss_history';

export class UnfinishedGames {
    /**
     * The a set of the unfinished game-history IDs
     */
    private unfinishedGames: Set<number>;
    /**
     * The database manager
     */
    private readonly dbManager: DbManager;

    constructor(dbManager: DbManager) {
        this.dbManager = dbManager;
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
        const gameHistoryIDs = [];
        try {
            // const winLossHistories = await WinLossHistory.findAll({
            //     attributes: ['gameHistoryId']
            // }).map((wlh: WinLossHistory) => wlh.gameHistoryId);
            const result = await GameHistory.findAll({
                attributes: ['id'],
                where: {
                    id: {
                        $notIn: `(${this.dbManager.sequelize.literal(`SELECT id FROM win_loss_history`)})`
                    }
                }
            });
            result.forEach((gh: GameHistory) => {
                gameHistoryIDs.push(gh.id);
                this.addUnfinishedGame(gh.id);
            });
        }
        catch (e) {
            console.log(`error getting the unfinished games`);
        }
        return gameHistoryIDs;
    }

    public async playerUnfinishedGames(playerId: number): Promise<Array<number>> {
        const gameHistoryIDs = [];
        try {
            const result = await GameHistoryPlayer.findAll({
                attributes: ['gameHistoryId'],
                where: {
                    playerId,
                    id: {
                        $notIn: `(${this.dbManager.sequelize.literal(`SELECT DISTINCT game_history_id FROM win_loss_history`)})`
                    }
                }
            });
            result.forEach((gameHistoryPlayer: GameHistoryPlayer) => {
                const ghid = gameHistoryPlayer.gameHistoryId;
                gameHistoryIDs.push(ghid);
                this.addUnfinishedGame(ghid);
            });
        }
        catch (e) {
            console.log(`error getting the unfinished games for player ${playerId}`);
        }
        return gameHistoryIDs;
    }
}
