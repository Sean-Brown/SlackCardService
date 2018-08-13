import { BaseCard } from '../../../card_service/base_classes/items/card';
import { GameHistoryPlayerActions } from '../../../db/actions/game_history_player_actions';
import { PlayerActions } from '../../../db/actions/player_actions';
import { Games } from '../../../db/games';
import { Manager as DbManager } from '../../../db/manager';
import { Player } from '../../../db/models/player';
import { ResponseCode } from '../../response_code';
import { DBRoutes } from '../database';
import { ActiveGames } from './lib/active_games';
import {
    CribbageHandResponse, CribbageReturnResponse, CribbageServiceResponse,
    CurrentGameResponse, GameAssociationResponse, GetUnfinishedGamesResponse, makeErrorResponse
} from './lib/response';
import { UnfinishedGames } from './lib/unfinished_games';

export class CribbageService {
    /**
     * The active games manager
     */
    public activeGames: ActiveGames;

    /**
     * The unfinished games manager
     */
    private unfinishedGames: UnfinishedGames;

    /**
     * Association of the player name to an ID number in the database. This
     * will help keep the class from constantly having to find the ID of a
     * player based on the player name
     */
    public players: Map<string, number>;

    /**
     * The ID of the Cribbage game in the database
     */
    private cribbageID: number;

    /**
     * The data base manager
     */
    private dbManager: DbManager = null;

    /**
     * An invalid player_id
     * @returns {number}
     * @constructor
     */
    public static get INVALID_ID(): number {
        return -1;
    }

    public constructor() {
        this.dbManager = new DbManager({
            database: process.env.DATABASE,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
        });
        this.activeGames = new ActiveGames();
        this.unfinishedGames = new UnfinishedGames(this.dbManager);
        this.players = new Map<string, number>();
        this.cribbageID = 0;
    }

    /**
     * Initialize the class
     * @returns {Promise} returns an error string if an error occurred, otherwise an empty string
     */
    public async init(): Promise<string> {
        // Get the Cribbage ID
        const gameResult = await DBRoutes.router.getGame(Games.Cribbage);
        if (gameResult === null) {
            return 'Unable to find or create the cribbage game in the database';
        }
        this.cribbageID = gameResult.id;
        // Load all the unfinished games
        const gameHistoryIDs = await this.unfinishedGames.getUnfinishedGames();
        gameHistoryIDs.forEach((ghid: number) => {
            this.unfinishedGames.addUnfinishedGame(ghid);
        });
        return '';
    }

    /**
     * Set a player in the players map if the player doesn't already exist
     * @param players the map of players to set the player in
     * @param player
     * @param id
     */
    public static setPlayer(players: Map<string, number>, player: string, id: number): void {
        if (!players.has(player)) {
            players.set(player, id);
        }
    }

    /**
     * Join the player to an unfinished game
     * @param playerId
     * @param player
     * @param gameHistoryId
     * @returns {Promise}
     */
    private async joinPlayerToUnfinishedGame(playerId: number, player: string, gameHistoryId: number): Promise<CribbageServiceResponse> {
        // Find if the player belongs to a game already
        if (this.activeGames.playerIsInGame(playerId, player)) {
            // The player is part of a game already
            return makeErrorResponse(`You're already in a game, leave that one first before joining another game.`);
        }
        else {
            // Check if the game is an unfinished game
            const isUnfinished = await this.unfinishedGames.isUnfinished(gameHistoryId);
            if (!isUnfinished) {
                // The game isn't one of the unfinished games
                return makeErrorResponse(`Game ${gameHistoryId} is not one of the unfinished games`);
            }
            else {
                // Make sure the player was in the game to begin with
                const playerInGameResult = await ActiveGames.playerWasInGame(playerId, gameHistoryId);
                if (!playerInGameResult.partOfGame) {
                    return makeErrorResponse(`You're not part of ${gameHistoryId}`);
                }
                else {
                    // Let the player rejoin the game, first get the GameAssociation object
                    const gameAssociationResult = await this.activeGames.getActiveGame(this.players, gameHistoryId);
                    // Set the player to game-history assocation
                    this.activeGames.setPlayerGame(playerId, gameHistoryId);
                    // Set the game as an active game
                    this.activeGames.setGameHistoryAssociation(gameHistoryId, gameAssociationResult.gameAssociation);
                    return new CribbageServiceResponse();
                }
            }
        }
    }

    /**
     * Join a player to either the given game or a new game if game_history_id is 0
     * @param playerId
     * @param player
     * @param gameHistoryId
     * @returns {Promise<CribbageServiceResponse>}
     */
    private async joinPlayerToGame(playerId: number, player: string, gameHistoryId: number): Promise<CribbageServiceResponse> {
        // Find if the player is in the new game
        if (this.activeGames.playerIsInGame(playerId, player)) {
            // The player is already part of the new game
            const game = this.activeGames.getPlayerGame(playerId);
            const message = game ? `You're already playing game #${game.game}` : 'You\'re already in the new, unbegun game';
            return makeErrorResponse(message);
        }
        else if (gameHistoryId !== CribbageService.INVALID_ID) {
            // The player is not part of the new game, add them to the existing game
            return this.joinPlayerToUnfinishedGame(playerId, player, gameHistoryId);
        }
        else {
            // The player is not part of the new game, add them to the new game
            this.activeGames.joinPlayerToNewGame(player);
            return new CribbageServiceResponse();
        }
    }

    /**
     * Get the given player's ID. If the player doesn't exist in the database, this method will add them to the database
     * @param playerName
     * @returns {Promise<number>}
     */
    private async getPlayerID(playerName: string): Promise<number> {
        const playerID = this.players.get(playerName);
        if (!playerID) {
            const player = await PlayerActions.findByName(playerName);
            if (!player) {
                // Player not in the database yet, add them
                try {
                    const player = await PlayerActions.create(playerName);
                    const playerID = player.id;
                    CribbageService.setPlayer(this.players, playerName, playerID);
                    return playerID;
                }
                catch (e) {
                    console.error(`Failed to add player ${playerName} to the database.`, e);
                    return CribbageService.INVALID_ID;
                }
            }
            else {
                const playerID = player.id;
                CribbageService.setPlayer(this.players, playerName, playerID);
                return playerID;
            }
        }
        else {
            CribbageService.setPlayer(this.players, playerName, playerID);
            return playerID;
        }
    }

    /**
     * Count the number of unfinished games
     * @returns {number}
     */
    public countUnfinishedGames(): number {
        return this.unfinishedGames.countUnfinishedGames();
    }

    /**
     * Get the players in the given game
     * @param gameHistoryId
     * @returns {Promise<Array<Player>>}
     */
    public async getGamePlayers(gameHistoryId: number): Promise<Array<Player>> {
        const players = await this.activeGames.getGamePlayers(gameHistoryId, this);
        if (players.length === 0) {
            try {
                const result = await GameHistoryPlayerActions.getGamePlayers(gameHistoryId);
                result.forEach((player: Player) => {
                    players.push(player);
                });
            }
            catch (e) {
                console.log(`error getting the players in game ${gameHistoryId}`, e);
            }
        }
        return players;
    }

    /**
     * Find a player's name given his/her ID
     * @param playerId
     * @returns {Promise<string>}
     */
    public async getPlayerName(playerId: number): Promise<string> {
        let playerName = '';
        this.players.forEach((pid: number, strPlayer: string) => {
            if (pid === playerId) {
                playerName = strPlayer;
            }
        });
        if (playerName.length === 0) {
            try {
                // Try to find the player in the database
                const result = await PlayerActions.findById(playerId);
                playerName = result.name;
                CribbageService.setPlayer(this.players, name, playerId);
            }
            catch (e) {
                console.log(`error getting player ${playerId} from the database`, e);
            }
        }
        else {
            return playerName;
        }
    }

    /**
     * Get the IDs of the games that the given player is not in
     * @param player
     * @returns {Promise}
     */
    public async getUnfinishedGames(player: string): Promise<GetUnfinishedGamesResponse> {
        const playerID = await this.getPlayerID(player);
        const gameHistoryIDs = await this.unfinishedGames.playerUnfinishedGames(playerID);
        return new GetUnfinishedGamesResponse(gameHistoryIDs);
    }

    /**
     * Get the given player's current game
     * @param player
     * @returns {Promise} the player's current game ID or -1 if the player is not in a game
     */
    public async getCurrentGame(player: string): Promise<number> {
        if (this.activeGames.newGame.players.findPlayer(player) !== null) {
            // the player is in the new game, return 0
            return 0;
        }
        const playerID = await this.getPlayerID(player);
        const response = this.activeGames.getPlayerGameID(playerID);
        if (response.status !== ResponseCode.ok) {
            // the player isn't in a game
            return -1;
        }
        else {
            // return the game ID
            return response.gameID;
        }
    }

    /**
     * Join a player to a game
     * @param player the name of the player
     * @param gameHistoryId the game-history ID, or 0 if they want to join a new game
     * @returns {Promise}
     */
    public async joinGame(player: string, gameHistoryId: number = CribbageService.INVALID_ID): Promise<CribbageServiceResponse> {
        const playerID = await this.getPlayerID(player);
        // Join the player to the game
        return this.joinPlayerToGame(playerID, player, gameHistoryId);
    }

    /**
     * Let the given player leave the game they're in
     * @param player
     * @returns {Promise}
     */
    public async leaveGame(player: string): Promise<CribbageServiceResponse> {
        const playerID = await this.getPlayerID(player);
        // Let the player leave the game
        return this.activeGames.leaveGame(playerID, player);
    }

    /**
     * Begin the new game that the given player is in
     * @param player the name of the player beginning the game -- they must be in the game to begin it
     * @returns {Promise}
     */
    public async beginGame(player: string): Promise<GameAssociationResponse> {
        return this.activeGames.beginGame(player, this.cribbageID, this.players);
    }

    /**
     * Reset the new game
     * @param secret
     * @returns {CribbageServiceResponse}
     */
    public resetGame(secret: string): CribbageServiceResponse {
        return this.activeGames.resetGame(secret);
    }

    /**
     * Describe the given game
     * @param gameHistoryId
     * @returns {CribbageServiceResponse}
     */
    public describe(gameHistoryId: number): CribbageServiceResponse {
        return this.activeGames.describe(gameHistoryId);
    }

    /**
     * Get the given player's hand from their active game
     * @param player
     * @returns {Promise<CribbageHandResponse>}
     */
    public async getPlayerHand(player: string): Promise<CribbageHandResponse> {
        const playerID = await this.getPlayerID(player);
        return this.activeGames.getPlayerHand(playerID, player);
    }

    /**
     * Play a card for the given player
     * @param player
     * @param card
     * @returns {Promise<CribbageReturnResponse>}
     */
    public async playCard(player: string, card: BaseCard): Promise<CribbageReturnResponse> {
        const playerID = await this.getPlayerID(player);
        try {
            return this.activeGames.playCard(playerID, player, card);
        }
        catch (error) {
            return <CribbageReturnResponse>makeErrorResponse(error);
        }
    }

    /**
     * Get the given player's current game
     * @param player
     * @returns {Promise<CurrentGameResponse>}
     */
    public async getPlayerGame(player: string): Promise<CurrentGameResponse> {
        const playerID = await this.getPlayerID(player);
        return this.activeGames.getPlayerGame(playerID);
    }

    /**
     * Give the players card(s) to the crib
     * @param player
     * @param cards
     * @returns {Promise<CribbageReturnResponse>}
     */
    public async giveToKitty(player: string, cards: Array<BaseCard>): Promise<CribbageReturnResponse> {
        const playerID = await this.getPlayerID(player);
        try {
            return this.activeGames.giveToKitty(playerID, player, cards);
        }
        catch (error) {
            return <CribbageReturnResponse>makeErrorResponse(error);
        }
    }

    /**
     * Let the given player 'go' in the game
     * @param player
     * @returns {Promise<CribbageReturnResponse>}
     */
    public async go(player: string): Promise<CribbageReturnResponse> {
        const playerID = await this.getPlayerID(player);
        try {
            return this.activeGames.go(playerID, player);
        }
        catch (error) {
            return <CribbageReturnResponse>makeErrorResponse(error);
        }
    }
}
