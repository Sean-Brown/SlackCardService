import {Cribbage} from "../../../../card_service/implementations/cribbage";
import {GameAssociation} from "./game_association";
import {CribbageRoutes} from "../../index";
import CribbageResponse = CribbageRoutes.CribbageResponse;
import {
    PlayerInGameResponse, makeErrorResponse, GameAssociationResponse, CribbageServiceResponse,
    CribbageHandResponse, CribbageReturnResponse, CurrentGameResponse
} from "./response";
import {game_history_player_actions} from "../../../../db/implementation/postgres/game_history_player_actions";
import {GameHistoryPlayerReturn, DBReturnStatus} from "../../../../db/abstraction/return/db_return";
import {Players} from "../../../../card_service/base_classes/card_game";
import {CribbagePlayer} from "../../../../card_service/implementations/cribbage_player";
import {CribbageHand} from "../../../../card_service/implementations/cribbage_hand";
import {recreateGame} from "./recreate_game";
import {GameHistory} from "../../../../db/abstraction/tables/game_history";
import {DBRoutes} from "../../database";
import {getErrorMessage} from "../../../lib";
import {BaseCard} from "../../../../card_service/base_classes/items/card";
import {ItemCollection} from "../../../../card_service/base_classes/collections/item_collection";
import {Player} from "../../../../db/abstraction/tables/player";
import {CribbageService} from "../cribbage_service";
var Q = require("q");

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
    private activeGames: Map<number, GameAssociation>;
    /**
     * A new Cribbage game that players can join
     */
    private newGame: Cribbage;

    private static get PLAYER_NOT_IN_GAME():string { return "You're not part of an active game"; }

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
    private removeGameAssociation(ga:GameAssociation, gameHistoryID:number): void {
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
    public playerIsInGame(playerID:number, player:string): boolean {
        return (this.playerGame.has(playerID) || (this.newGame.players.findPlayer(player) != null));
    }

    /**
     * Find out if a player was part of a given game
     * @param playerID
     * @param gameHistoryID
     */
    public playerWasInGame(playerID:number, gameHistoryID:number): Q.Promise<PlayerInGameResponse> {
        return new Q.Promise((resolve) => {
            game_history_player_actions.findAssociation(playerID, gameHistoryID)
                .then((result:GameHistoryPlayerReturn) => {
                    if (result.status != DBReturnStatus.ok) {
                        resolve(makeErrorResponse(result.message));
                    }
                    else {
                        resolve(new PlayerInGameResponse(result.first() != null));
                    }
                });
        });
    }

    /**
     * Get the game association associated with the given game-history
     * @param players the association between a player name and a player ID
     * @param gameHistoryID
     * @returns {GameAssociation}
     */
    public getActiveGame(players:Map<string, number>, gameHistoryID:number): Q.Promise<GameAssociationResponse> {
        return new Q.Promise((resolve) => {
            let gameAssociation = this.activeGames.get(gameHistoryID);
            if (gameAssociation != null) {
                resolve(new GameAssociationResponse(gameAssociation));
            }
            else {
                // The active game hasn't yet been created, so make it and then add the player to it
                return recreateGame(players, gameHistoryID);
            }
        });
    }

    /**
     * Get the players in a given game
     * @param gameHistoryID
     * @param service the Cribbage service used to find players names from their ID
     */
    public getGamePlayers(gameHistoryID:number, service:CribbageService): Q.Promise<Array<Player>> {
        return new Q.Promise((resolve) => {
            let players = [];
            let ga = this.activeGames.get(gameHistoryID);
            if (ga) {
                ga.playerIDs.forEach((playerID: number) => {
                    service.getPlayerName(playerID)
                        .then((player:string) => {
                            if (player.length > 0) {
                                players.push(new Player(playerID, player));
                            }
                            else {
                                console.error(`Unable to find player ${playerID}`);
                            }
                        });
                });
            }
            resolve(players);
        });
    }

    /**
     * Set the player to game-history association
     * @param playerID
     * @param gameHistoryID
     */
    public setPlayerGame(playerID:number, gameHistoryID:number): void {
        this.playerGame.set(playerID, gameHistoryID);
    }

    /**
     * Associate the game-history ID with a GameAssociation object
     * @param gameHistoryID
     * @param gameAssociation
     */
    public setGameHistoryAssociation(gameHistoryID:number, gameAssociation:GameAssociation): void {
        this.activeGames.set(gameHistoryID, gameAssociation);
    }

    /**
     * Join the player to a new game
     * @param player
     * @returns {Q.Promise}
     */
    public joinPlayerToNewGame(player:string): void {
        if (this.newGame.players.findPlayer(player) == null) {
            // Add the player to the game
            this.newGame.addPlayer(new CribbagePlayer(player, new CribbageHand([])));
        }
    }

    /**
     * Begin the new game
     * @param refPlayer the player beginning the game -- they must be part of the new game to begin it
     * @param cribbageID the ID of the Cribbage game in the database
     * @param players the association of a player's name to their playerID in the database. This
     * is just used for reference, these aren't the actual players joining the game
     */
    public beginGame(refPlayer:string, cribbageID:number, players:Map<string, number>): Q.Promise<GameAssociationResponse> {
        let that = this;
        return new Q.Promise((resolve) => {
            // Get the IDs of each player in the game
            let playerIDs = new Set<number>();
            let errors = [];
            for (let ix = 0; ix < that.newGame.players.countItems(); ix++) {
                let player = that.newGame.players.itemAt(ix);
                let playerID = players.get(player.name);
                if (playerID != null) {
                    playerIDs.add(playerID);
                }
                else {
                    errors.push(`Unable to find the ID for player ${player}`);
                }
            }
            if (errors.length > 0) {
                resolve(getErrorMessage(errors));
            }
            else {
                // Check the player is a member of the new game
                let playerID = players.get(refPlayer);
                if (!playerIDs.has(playerID)) {
                    resolve(makeErrorResponse(`Player ${refPlayer} is not part of the new game`));
                }
                // Begin the new game
                that.newGame.begin();
                // Add a row for the new game in the database and create the associations with each player in the game
                DBRoutes.router.createGameHistory(cribbageID, Array.from(playerIDs))
                    .then((gameHistory: GameHistory) => {
                        // Add to the map of active games
                        let gameHistoryID = gameHistory.id;
                        let gameAssociation = new GameAssociation(that.newGame, gameHistoryID, playerIDs);
                        that.activeGames.set(gameHistoryID, gameAssociation);
                        // Create a fresh game for players to join
                        that.newGame = new Cribbage(new Players([]));
                        // Resolve
                        resolve(new GameAssociationResponse(gameAssociation));
                    })
                    .catch(() => {
                        resolve(makeErrorResponse("Unable to create the game-history record in the database"));
                    });
            }
        });
    }

    /**
     * Reset the new game
     * @param secret the secret required to reset the game
     * @returns {CribbageServiceResponse}
     */
    public resetGame(secret:string): CribbageServiceResponse {
        if (secret == process.env.CRIB_RESET_SECRET) {
            this.newGame = new Cribbage(new Players([]));
            return new CribbageServiceResponse();
        }
        else {
            return makeErrorResponse("Incorrect password");
        }
    }

    /**
     * Format an error string
     * @param gameHistoryID
     * @returns {string}
     */
    public static gameNotFoundError(gameHistoryID:number):string { return `Unable to find game ${gameHistoryID}`; }

    /**
     * Describe the given game
     * @param gameHistoryID
     */
    public describe(gameHistoryID:number): CribbageServiceResponse {
        if (this.activeGames.has(gameHistoryID)) {
            return new CribbageServiceResponse(DBReturnStatus.ok, this.activeGames.get(gameHistoryID).game.describe());
        }
        else {
            return new CribbageServiceResponse(DBReturnStatus.error, ActiveGames.gameNotFoundError(gameHistoryID));
        }
    }

    /**
     * Get the given player's current hand
     * @param playerID
     * @param player
     */
    public getPlayerHand(playerID:number, player:string): CribbageHandResponse {
        if (!this.playerGame.has(playerID)) {
            // The player isn't part of an active game
            return <CribbageHandResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        else {
            // Find the player's current game
            let ga = this.activeGames.get(this.playerGame.get(playerID));
            return new CribbageHandResponse(ga.game.getPlayerHand(player));
        }
    }

    /**
     * Play a card for the given play
     * @param playerID
     * @param player
     * @param card
     */
    public playCard(playerID:number, player:string, card:BaseCard): CribbageReturnResponse {
        if (!this.playerGame.has(playerID)) {
            return <CribbageReturnResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        else {
            // Find the game the player is in
            let gameHistoryID = this.playerGame.get(playerID);
            let ga = this.activeGames.get(gameHistoryID);
            let result = ga.game.playCard(player, card);
            if (result.gameOver) {
                this.removeGameAssociation(ga, gameHistoryID);
            }
            return new CribbageReturnResponse(result, ga.game, ga.gameHistoryID);
        }
    }

    /**
     * Get the given player's current game
     * @param playerID
     */
    public getPlayerGame(playerID:number): CurrentGameResponse {
        if (!this.playerGame.has(playerID)) {
            return <CurrentGameResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        else {
            let gameHistoryID = this.playerGame.get(playerID);
            return new CurrentGameResponse(this.activeGames.get(gameHistoryID).game);
        }
    }

    /**
     * Give the players card(s) to the crib
     * @param playerID
     * @param player
     * @param cards
     */
    public giveToKitty(playerID:number, player:string, cards:Array<BaseCard>): CribbageReturnResponse {
        if (!this.playerGame.has(playerID)) {
            return <CribbageReturnResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        else {
            // Find the game the player is in
            let gameHistoryID = this.playerGame.get(playerID);
            let ga = this.activeGames.get(gameHistoryID);
            let result = ga.game.giveToKitty(player, new ItemCollection(cards));
            if (result.gameOver) {
                this.removeGameAssociation(ga, gameHistoryID);
            }
            return new CribbageReturnResponse(result, ga.game, ga.gameHistoryID);
        }
    }

    /**
     * Let the given player 'go' in the game
     * @param playerID
     * @param player
     */
    public go(playerID:number, player:string): CribbageReturnResponse {
        if (!this.playerGame.has(playerID)) {
            return <CribbageReturnResponse>makeErrorResponse(ActiveGames.PLAYER_NOT_IN_GAME);
        }
        else {
            // Find the game the player is in
            let gameHistoryID = this.playerGame.get(playerID);
            let ga = this.activeGames.get(gameHistoryID);
            let result = ga.game.go(player);
            if (result.gameOver) {
                this.removeGameAssociation(ga, gameHistoryID);
            }
            return new CribbageReturnResponse(result, ga.game, ga.gameHistoryID);
        }
    }
}