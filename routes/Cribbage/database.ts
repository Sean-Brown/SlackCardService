import { CribbageHandHistoryActions } from '../../db/actions/cribbage_hand_history_actions';
import { GameActions } from '../../db/actions/game_actions';
import { GameHistoryActions } from '../../db/actions/game_history_actions';
import { GameHistoryPlayerActions } from '../../db/actions/game_history_player_actions';
import { PlayerActions } from '../../db/actions/player_actions';
import { WinLossHistoryActions } from '../../db/actions/win_loss_history_actions';
import CribbageHandHistory from '../../db/models/cribbage_hand_history';
import Game from '../../db/models/Game';
import GameHistory from '../../db/models/game_history';
import Player from '../../db/models/player';

export namespace DBRoutes {

    export enum Routes {
        winLossHistory = '/wlHistory',
        gameHistory = '/gameHistory',
        handHistory = '/handHistory'
    }

    export class WinLossHistoryResponse {
        wins: number;
        losses: number;
    }

    export class GameHistoryItem {
        game: GameHistory;
        won: boolean;
    }
    export class GameHistoryResponse {
        games: Array<GameHistoryItem>;
    }

    export class CribbageHandHistoryResponse {
        hands: Array<CribbageHandHistory>;
    }

    class Router {
        /**
         * Add a player to the database. If the player already exists, then return that player
         * from the database.
         * @param {string} playerName the name of the player
         * @returns {Promise} resolves on a Player object or null if there was an error
         */
        async addPlayer(playerName: string): Promise<Player> {
            try {
                const player = await PlayerActions.findByName(playerName);
                if (player) {
                    console.warn(`Player ${playerName} already exists in the database`);
                    return player;
                }
                else {
                    // The player does not exist, create them
                    const player = await PlayerActions.create(playerName);
                    if (!player) {
                        console.error(`error creating player ${playerName}`);
                        return null;
                    }
                    else {
                        console.log(`Created player ${playerName} in the database`);
                        return player;
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }

        /**
         * Create a game history entry for the given game and players
         * @param gameID the ID of the game (i.e. the Cribbage ID in the database)
         * @param playerIDs the IDs of the players who are part of this game
         * @returns {Promise<GameHistory>}
         */
        async createGameHistory(gameID: number, playerIDs: Array<number>): Promise<GameHistory> {
            try {
                const gameHistory = await GameHistoryActions.create(gameID);
                if (!gameHistory) {
                    console.error(`error creating a game history entry`);
                    return null;
                }
                // Associate the players with the game
                const assocResult = await GameHistoryPlayerActions.createAssociations(gameHistory.id, playerIDs);
                if (!assocResult) {
                    // Something went wrong
                    console.error(`failed to create the game-player association for game ${gameHistory.id}`);
                    return null;
                }
                else {
                    // Success! Resolve on the GameHistory object that was created
                    console.log(`Added ${playerIDs} to the game history`);
                    return gameHistory;
                }
            }
            catch (err) {
                console.error(err);
                return null;
            }
        }

        /**
         * Get the Game object for the given game, or create the game row if that game does not exist
         * @param gameName the name of the game
         * @returns {Promise<Game>} a promise to return a Game object representing a row in the <game> database table
         */
        async getGame(gameName: string): Promise<Game> {
            try {
                const game = await GameActions.findByName(gameName);
                if (!game) {
                    // The game doesn't exist, create it
                    const game = await GameActions.create(gameName);
                    if (!game) {
                        console.error(`Error creating ${gameName}`);
                        return null;
                    }
                    else {
                        return game;
                    }
                }
                else {
                    return game;
                }
            }
            catch (err) {
                console.error(err);
                return null;
            }
        }

        /**
         * Reset the game, this entails removing the Cribbage-hand-history entries.
         * There's no reason to remove the GameHistory or GameHistoryPlayer records,
         * those can be re-used.
         * @note this method always resolves: check the boolean result to check for success.
         * @param gameHistoryID
         * @returns {Promise} whether or not resetting the Cribbage-hand-history succeeds
         */
        async resetGame(gameHistoryID: number): Promise<boolean> {
            try {
                await CribbageHandHistoryActions.remove(gameHistoryID);
                console.log(`The GameHistory ${gameHistoryID} was reset`);
                return true;
            }
            catch (err) {
                console.error(err);
                return false;
            }
        }

        /**
         * Get a player's win-loss history results -- count the number of wins and losses
         * @param player
         * @returns {null}
         */
        async winLossHistory(player: string): Promise<WinLossHistoryResponse> {
            try {
                const wlhResults = await WinLossHistoryActions.get(player);
                const ret = new WinLossHistoryResponse();
                if (wlhResults.length > 0) {
                    for (const wlhResult of wlhResults) {
                        if (wlhResult.won) {
                            ret.wins++;
                        }
                        else {
                            ret.losses++;
                        }
                    }
                }
                return ret;
            }
            catch (err) {
                console.error(err);
                return null;
            }
        }
    }
    export const router = new Router();
}
