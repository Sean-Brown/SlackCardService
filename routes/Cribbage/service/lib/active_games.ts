import { Players } from '../../../../card_service/base_classes/card_game';
import { ItemCollection } from '../../../../card_service/base_classes/collections/item_collection';
import { BaseCard } from '../../../../card_service/base_classes/items/card';
import { Cribbage } from '../../../../card_service/implementations/cribbage';
import { CribbageHand } from '../../../../card_service/implementations/cribbage_hand';
import { CribbagePlayer } from '../../../../card_service/implementations/cribbage_player';
import { GameHistoryPlayerActions } from '../../../../db/actions/game_history_player_actions';
import { Player } from '../../../../db/models/player';
import { getErrorMessage } from '../../../lib';
import { ResponseCode } from '../../../response_code';
import { DBRoutes } from '../../database';
import { CribbageService } from '../cribbage_service';
import { GameAssociation } from './game_association';
import { recreateGame } from './recreate_game';
import {
    CribbageHandResponse, CribbageReturnResponse, CribbageServiceResponse, CurrentGameResponse,
    GameAssociationResponse, GetCurrentGameResponse, makeErrorResponse, PlayerInGameResponse
} from './response';

export class ActiveGames {
    /**
     * Association of player_id to game_history ID, i.e. this map will track
     * whether or not the player is in an active game. This should
     * allow playerIDs to not type the ID of the associated game with
     * every command: they just join a game and this class knows
     * which instance of Cribbage to perform the actions against
     */
    private playerGame: Map<number, number>;
    /**
     * Associate a game-history ID with a GameAssociation
     */
    public activeGames: Map<number, GameAssociation>;
    /**
     * A new Cribbage game that players can join
     */
    public newGame: Cribbage;

    private static get PLAYER_NOT_IN_GAME(): string {
        return 'You\'re not part of an active game';
    }

    constructor() {
        this.playerGame = new Map<number, number>();
        this.activeGames = new Map<number, GameAssociation>();
        this.newGame = new Cribbage(new Players([]));
    }

    /**
     * Remove the game association and the active game from each player in the game
     * @param ga
     * @param gameHistoryID
     */
    private removeGameAssociation(ga: GameAssociation, gameHistoryID: number): void {
        // Remove the association from each player
        ga.playerIDs.forEach((pid) => {
            this.playerGame.delete(pid);
        });
        // Remove the active game
        this.activeGames.delete(gameHistoryID);
    }

    /**
     * Check if the given player is already in a game
     * @param playerID
     * @param player
     * @returns true if the player has a game
     */
    public playerIsInGame(playerID: number, player: string): boolean {
        return (this.playerGame.has(playerID) || (this.newGame.players.findPlayer(player) !== null));
    }

    /**
     * Find out if a player was part of a given game
     * @param playerID
     * @param gameHistoryID
     */
    public static async playerWasInGame(playerID: number, gameHistoryID: number): Promise<PlayerInGameResponse> {
        const result = await GameHistoryPlayerActions.findAssociation(playerID, gameHistoryID);
        return new PlayerInGameResponse(result !== null);
    }

    /**
     * Get the game association associated with the given game-history
     * @param players the association between a player name and a player ID
     * @param gameHistoryID
     * @returns {GameAssociation}
     */
    public async getActiveGame(players: Map<string, number>, gameHistoryID: number): Promise<GameAssociationResponse> {
        const gameAssociation = this.activeGames.get(gameHistoryID);
        if (gameAssociation !== null) {
            return new GameAssociationResponse(gameAssociation);
        }
        // The active game hasn't yet been created, so make it and then add the player to it
        return await recreateGame(gameHistoryID, players);
    }

    /**
     * Get the players in a given game
     * @param gameHistoryID
     * @param service the Cribbage service used to find players names from their ID
     */
    public async getGamePlayers(gameHistoryID: number, service: CribbageService): Promise<Array<Player>> {
        const players = [];
        const ga = this.activeGames.get(gameHistoryID);
        if (ga) {
            for (const playerID of ga.playerIDs) {
                const player = await service.getPlayerName(playerID);
                if (player.length > 0) {
                    players.push(new Player({
                        id: playerID,
                        name: player
                    }));
                }
                else {
                    console.error(`Unable to find player ${playerID}`);
                }
            }
        }
        return players;
    }

    /**
     * Set the player to game-history association
     * @param playerID
     * @param gameHistoryID
     */
    public setPlayerGame(playerID: number, gameHistoryID: number): void {
        this.playerGame.set(playerID, gameHistoryID);
    }

    /**
     * Associate the game-history ID with a GameAssociation object
     * @param gameHistoryID
     * @param gameAssociation
     */
    public setGameHistoryAssociation(gameHistoryID: number, gameAssociation: GameAssociation): void {
        this.activeGames.set(gameHistoryID, gameAssociation);
    }

    /**
     * Join the player to a new game
     * @param player
     * @returns {Promise}
     */
    public joinPlayerToNewGame(player: string): void {
        if (this.newGame.players.findPlayer(player) === null) {
            // Add the player to the game
            this.newGame.addPlayer(new CribbagePlayer(player, new CribbageHand([])));
        }
    }

    /**
     * Let the player leave their current active game
     * @param playerID
     * @param player
     */
    public leaveGame(playerID: number, player: string): CribbageServiceResponse {
        const activeGameID = this.playerGame.get(playerID);
        if (activeGameID) {
            // Disassociate them from the active game
            this.playerGame.delete(playerID);
            return new CribbageServiceResponse(ResponseCode.ok, `Removed you from ${activeGameID}`);
        }
        // Check the new game
        const gamePlayer = this.newGame.players.findPlayer(player);
        if (gamePlayer) {
            // Remove them from the new game
            this.newGame.players.removeItem(gamePlayer);
            return new CribbageServiceResponse(ResponseCode.ok, 'Removed you from the new game');
        }
        // They're not part of any game
        return new CribbageServiceResponse(ResponseCode.ok, 'You\'re not part of any game');
    }

    /**
     * Begin the new game
     * @param refPlayer the player beginning the game -- they must be part of the new game to begin it
     * @param cribbageID the ID of the Cribbage game in the database
     * @param players the association of a player's name to their player_id in the database. This
     * is just used for reference, these aren't the actual players joining the game
     */
    public async beginGame(refPlayer: string, cribbageID: number, players: Map<string, number>): Promise<GameAssociationResponse> {
        // Get the IDs of each player in the game
        const playerIDs = new Set<number>();
        const errors = [];
        for (let ix = 0; ix < this.newGame.players.countItems(); ix++) {
            const player = this.newGame.players.itemAt(ix);
            const playerID = players.get(player.name);
            if (playerID !== null) {
                playerIDs.add(playerID);
            }
            else {
                errors.push(`Unable to find the ID for player ${player}`);
            }
        }
        if (errors.length > 0) {
            return <GameAssociationResponse>new CribbageServiceResponse(ResponseCode.error, getErrorMessage(errors));
        }
        // Check the player is a member of the new game
        const playerID = players.get(refPlayer);
        if (!playerIDs.has(playerID)) {
            return <GameAssociationResponse>makeErrorResponse(`Player ${refPlayer} is not part of the new game`);
        }
        // Begin the new game
        this.newGame.begin();
        try {
            // Add a row for the new game in the database and create the associations with each player in the game
            const gameHistory = await DBRoutes.router.createGameHistory(cribbageID, Array.from(playerIDs));
            // Add to the map of active games
            const gameHistoryID = gameHistory.id;
            const gameAssociation = new GameAssociation(this.newGame, gameHistoryID, playerIDs);
            this.activeGames.set(gameHistoryID, gameAssociation);
            // Set the player game associations
            const pids: number[] = [];
            playerIDs.forEach((playerID: number) => {
                this.playerGame.set(playerID, gameHistoryID);
                pids.push(playerID);
            });
            await GameHistoryPlayerActions.createAssociations(gameHistoryID, pids);
            // Create a fresh game for players to join
            this.newGame = new Cribbage(new Players([]));
            // Resolve
            return new GameAssociationResponse(gameAssociation);
        }
        catch (e) {
            return <GameAssociationResponse>makeErrorResponse('Unable to create the game-history record in the database');
        }
    }

    /**
     * Reset the new game
     * @param secret the secret required to reset the game
     * @returns {CribbageServiceResponse}
     */
    public resetGame(secret: string): CribbageServiceResponse {
        if (secret === process.env.CRIB_RESET_SECRET) {
            this.newGame = new Cribbage(new Players([]));
            return new CribbageServiceResponse();
        }
        return makeErrorResponse('Incorrect password');
    }

    /**
     * Format an error string
     * @param gameHistoryID
     * @returns {string}
     */
    public static gameNotFoundError(gameHistoryID: number): string {
        return `Unable to find game ${gameHistoryID}`;
    }

    /**
     * Describe the given game
     * @param gameHistoryID
     */
    public describe(gameHistoryID: number): CribbageServiceResponse {
        if (this.activeGames.has(gameHistoryID)) {
            return new CribbageServiceResponse(ResponseCode.ok, this.activeGames.get(gameHistoryID).game.describe());
        }
        return new CribbageServiceResponse(ResponseCode.error, ActiveGames.gameNotFoundError(gameHistoryID));
    }

    /**
     * Get the given player's current hand
     * @param playerID
     * @param player
     */
    public getPlayerHand(playerID: number, player: string): CribbageHandResponse {
        if (!this.playerGame.has(playerID)) {
            // The player isn't part of an active game
            return <CribbageHandResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        // Find the player's current game
        const ga = this.activeGames.get(this.playerGame.get(playerID));
        return new CribbageHandResponse(ga.game.getPlayerHand(player));
    }

    /**
     * Play a card for the given play
     * @param playerID
     * @param player
     * @param card
     */
    public playCard(playerID: number, player: string, card: BaseCard): CribbageReturnResponse {
        if (!this.playerGame.has(playerID)) {
            return <CribbageReturnResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        // Find the game the player is in
        const gameHistoryID = this.playerGame.get(playerID);
        const ga = this.activeGames.get(gameHistoryID);
        if (ga) {
            const result = ga.game.playCard(player, card);
            if (result.gameOver) {
                this.removeGameAssociation(ga, gameHistoryID);
            }
            return new CribbageReturnResponse(result, ga.game, ga.gameHistoryID);
        }
        else {
            return <CribbageReturnResponse>makeErrorResponse('You\'re not in a game');
        }
    }

    /**
     * Get the given player's current game
     * @param playerID
     */
    public getPlayerGame(playerID: number): CurrentGameResponse {
        if (!this.playerGame.has(playerID)) {
            return <CurrentGameResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        const gameHistoryID = this.playerGame.get(playerID);
        return new CurrentGameResponse(this.activeGames.get(gameHistoryID).game);
    }

    /**
     * Get the given player's current game ID
     * @param playerID
     * @returns {GetCurrentGameResponse}
     */
    public getPlayerGameID(playerID: number): GetCurrentGameResponse {
        if (!this.playerGame.has(playerID)) {
            return <GetCurrentGameResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        return new GetCurrentGameResponse(this.playerGame.get(playerID));
    }

    /**
     * Give the players card(s) to the crib
     * @param playerID
     * @param player
     * @param cards
     */
    public giveToKitty(playerID: number, player: string, cards: Array<BaseCard>): CribbageReturnResponse {
        if (!this.playerGame.has(playerID)) {
            return <CribbageReturnResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        // Find the game the player is in
        const gameHistoryID = this.playerGame.get(playerID);
        const ga = this.activeGames.get(gameHistoryID);
        const result = ga.game.giveToKitty(player, new ItemCollection(cards));
        if (result.gameOver) {
            this.removeGameAssociation(ga, gameHistoryID);
        }
        return new CribbageReturnResponse(result, ga.game, ga.gameHistoryID);
    }

    /**
     * Let the given player 'go' in the game
     * @param playerID
     * @param player
     */
    public go(playerID: number, player: string): CribbageReturnResponse {
        if (!this.playerGame.has(playerID)) {
            return <CribbageReturnResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        // Find the game the player is in
        const gameHistoryID = this.playerGame.get(playerID);
        const ga = this.activeGames.get(gameHistoryID);
        const result = ga.game.go(player);
        if (result.gameOver) {
            this.removeGameAssociation(ga, gameHistoryID);
        }
        return new CribbageReturnResponse(result, ga.game, ga.gameHistoryID);
    }
}
