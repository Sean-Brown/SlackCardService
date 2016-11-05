import {PGQueryReturn, pg_mgr} from "../../../db/implementation/postgres/manager";
import {Player} from "../../../db/abstraction/tables/player";
import {DBRoutes} from "../database";
import {CribbageRoutes} from "../../../routes/cribbage";
import CribbageHandHistoryResponse = DBRoutes.CribbageHandHistoryResponse;
import Router = CribbageRoutes.Router;
import {
    CribbageServiceResponse, PlayerInGameResponse, GameAssociationResponse, makeErrorResponse, checkResponse,
    CribbageHandResponse, CribbageReturnResponse, CurrentGameResponse, GetUnfinishedGamesResponse
} from "./lib/response";
import {UnfinishedGames} from "./lib/unfinished_games";
import {ActiveGames} from "./lib/active_games";
import {Game} from "../../../db/abstraction/tables/game";
import {Games} from "../../../db/implementation/games";
import {BaseCard} from "../../../card_service/base_classes/items/card";
import {player_actions} from "../../../db/implementation/postgres/player_actions";
import {PlayerReturn, DBReturnStatus} from "../../../db/abstraction/return/db_return";
import {GameHistoryPlayerPivot} from "../../../db/abstraction/tables/game_history_player";
import {getTableName, DBTables} from "../../../db/abstraction/tables/base_table";
var Q = require("q");

export class CribbageService {
    /**
     * The active games manager
     */
    private activeGames: ActiveGames;

    /**
     * The unfinished games manager
     */
    private unfinishedGames: UnfinishedGames;

    /**
     * Association of the player name to an ID number in the database. This
     * will help keep the class from constantly having to find the ID of a
     * player based on the player name
     */
    private players: Map<string, number>;

    /**
     * The ID of the Cribbage game in the database
     */
    private cribbageID: number;

    private static get INVALID_ID():number { return -1; }

    public constructor() {
        this.activeGames = new ActiveGames();
        this.unfinishedGames = new UnfinishedGames();
        this.players = new Map<string, number>();
        this.cribbageID = 0;
    }

    /**
     * Initialize the class
     * @returns {Q.Promise} returns an error string if an error occurred, otherwise an empty string
     */
    public init(): Q.Promise<string> {
        var that = this;
        return new Q.Promise((resolve) => {
            // Get the Cribbage ID
            DBRoutes.router.getGame(Games.Cribbage)
                .then((result: Game) => {
                    that.cribbageID = result.id;
                    // Load all the unfinished games
                    return that.unfinishedGames.getUnfinishedGames()
                })
                .then((gameHistoryIDs: Array<number>) => {
                    for (let ix = 0; ix < gameHistoryIDs.length; ix++) {
                        that.unfinishedGames.addUnfinishedGame(gameHistoryIDs[ix]);
                    }
                    resolve("");
                });
        });
    }

    /**
     * Join the player to an unfinished game
     * @param playerID
     * @param player
     * @param gameHistoryID
     * @returns {Q.Promise}
     */
    private joinPlayerToUnfinishedGame(playerID: number, player: string, gameHistoryID: number): Q.Promise<CribbageServiceResponse> {
        var that = this;
        return new Q.Promise((resolve) => {
            // Find if the player belongs to a game already
            if (that.activeGames.playerIsInGame(playerID, player)) {
                // The player is part of a game already
                resolve(makeErrorResponse(`You're already a in game, leave that one first before joining another game.`));
            }
            else if (!that.unfinishedGames.isUnfinished(gameHistoryID)) {
                // The game isn't one of the unfinished games
                resolve(makeErrorResponse(`Game ${gameHistoryID} is not one of the unfinished games`));
            }
            else {
                // Make sure the player was in the game to begin with
                that.activeGames.playerWasInGame(playerID, gameHistoryID)
                    .then((result: PlayerInGameResponse) => {
                        checkResponse(result, resolve);
                        if (!result.partOfGame) {
                            resolve(makeErrorResponse(`You're not part of ${gameHistoryID}`));
                        }
                        else {
                            // Let the player rejoin the game, first get the GameAssociation object
                            return that.activeGames.getActiveGame(that.players, gameHistoryID);
                        }
                    })
                    .then((result: GameAssociationResponse) => {
                        checkResponse(result, resolve);
                        // Set the player to game-history assocation
                        that.activeGames.setPlayerGame(playerID, gameHistoryID);
                        // Set the game as an active game
                        that.activeGames.setGameHistoryAssociation(gameHistoryID, result.gameAssociation);
                    });
            }
        });
    }

    /**
     * Join a player to either the given game or a new game if gameHistoryID is 0
     * @param playerID
     * @param player
     * @param gameHistoryID
     * @returns {Q.Promise<CribbageServiceResponse>}
     */
    private joinPlayerToGame(playerID: number, player: string, gameHistoryID: number): Q.Promise<CribbageServiceResponse> {
        let that = this;
        return new Q.Promise((resolve) => {
            // Find if the player is in the new game
            if (that.activeGames.playerIsInGame(playerID, player)) {
                // The player is already part of the new game
                resolve(makeErrorResponse("You're already part of a new game"));
            }
            else if (gameHistoryID != 0) {
                // The player is not part of the new game, add them to the existing game
                return this.joinPlayerToUnfinishedGame(playerID, player, gameHistoryID);
            }
            else {
                // The player is not part of the new game, add them to the new game
                that.activeGames.joinPlayerToNewGame(player);
                resolve(new CribbageServiceResponse());
            }
        });
    }

    /**
     * Get the given player's ID. If the player doesn't exist in the database, this method will add them to the database
     * @param player
     * @returns {number}
     */
    private getPlayerID(player: string): Q.Promise<number> {
        var that = this;
        return new Q.Promise((resolve) => {
            let playerID = that.players.get(player);
            if (!playerID) {
                player_actions.findByName(player)
                    .then((result:PlayerReturn) => {
                        if (result.status != DBReturnStatus.ok) {
                            resolve(CribbageService.INVALID_ID);
                        }
                        else if (result.result.length == 0) {
                            // Player not in the database yet, add them
                            DBRoutes.router.addPlayer(player)
                                .then((dbPlayer: Player) => {
                                    resolve(dbPlayer.id);
                                })
                                .catch(() => {
                                    console.log(`Failed to add player ${player} to the database`);
                                    resolve(CribbageService.INVALID_ID);
                                });
                        }
                        else {
                            resolve(result.first().id);
                        }
                    })
            }
            else {
                resolve(playerID);
            }
        });
    }

    /**
     * Check the player's ID, if it's invalid then resolve with an error response
     * @param playerID
     * @param resolve
     */
    private static checkPlayerID(playerID:number, resolve:Function): void {
        if (playerID == CribbageService.INVALID_ID) {
            resolve(<CribbageHandResponse>makeErrorResponse("Unable to find you in the database"));
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
     * @param gameHistoryID
     * @returns {Q.Promise}
     */
    private getGamePlayersInner(gameHistoryID:number):Q.Promise<Array<Player>> {
        return new Q.Promise((resolve) => {
            let players = [];
            var query = `
                SELECT *
                FROM ${getTableName(DBTables.Player)}
                WHERE ${Player.COL_ID} IN (
                    SELECT ${GameHistoryPlayerPivot.COL_PLAYER_ID}
                    FROM ${getTableName(DBTables.GameHistoryPlayer)}
                    WHERE ${GameHistoryPlayerPivot.COL_GAME_HISTORY_ID}=${gameHistoryID}
                );
            `.trim();
            pg_mgr.runQuery(query)
                .then((result:PGQueryReturn) => {
                    if (result.error.length > 0) {
                        console.error(result.error);
                        resolve([]);
                    }
                    else {
                        result.value.rows.forEach((player:Player) => {
                            players.push(player);
                        });
                        resolve(players);
                    }
                });
        });
    }

    /**
     * Get the players in the given game
     * @param gameHistoryID
     * @returns {Array<Player>}
     */
    public getGamePlayers(gameHistoryID:number): Q.Promise<Array<Player>> {
        var that = this;
        return new Q.Promise((resolve) => {
            that.activeGames.getGamePlayers(gameHistoryID, this)
                .then((players:Array<Player>) => {
                    if (players.length == 0) {
                        // The game wasn't an active game, try searching the database
                        that.getGamePlayersInner(gameHistoryID)
                            .then((gamePlayers:Array<Player>) => {
                                resolve(gamePlayers);
                            });
                    }
                    else {
                        resolve(players);
                    }
                });
        });
    }

    /**
     * Find a player's name given his/her ID
     * @param playerID
     */
    public getPlayerName(playerID:number): Q.Promise<string> {
        return new Q.Promise((resolve) => {
            let player = "";
            this.players.forEach((pid:number, strPlayer:string) => {
                if (pid == playerID) {
                    player = strPlayer;
                }
            });
            if (player.length == 0) {
                // Try to find the player in the database
                player_actions.find(playerID)
                    .then((result:PlayerReturn) => {
                        if (result.status != DBReturnStatus.ok) {
                            console.error(result.message);
                            resolve("");
                        }
                        else {
                            resolve(result.first().name);
                        }
                    });
            }
            else {
                resolve(player);
            }
        });
    }

    /**
     * Get the IDs of the games that the given player is not in
     * @param player
     * @returns {Q.Promise}
     */
    public getUnfinishedGames(player:string): Q.Promise<GetUnfinishedGamesResponse> {
        var that = this;
        return new Q.Promise((resolve) => {
            that.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    that.unfinishedGames.playerUnfinishedGames(result)
                        .then((gameHistoryIDs:Array<number>) => {
                            resolve(new GetUnfinishedGamesResponse(gameHistoryIDs));
                        });
                });
        });
    }

    /**
     * Join a player to a game
     * @param player the name of the player
     * @param gameHistoryID the game-history ID, or 0 if they want to join a new game
     * @returns {Q.Promise}
     */
    public joinGame(player: string, gameHistoryID: number = 0): Q.Promise<CribbageServiceResponse> {
        var that = this;
        return new Q.Promise((resolve) => {
            that.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    // Join the player to the game
                    resolve(that.joinPlayerToGame(result, player, gameHistoryID));
                });
        });
    }

    /**
     * Begin the new game that the given player is in
     * @param player the name of the player beginning the game -- they must be in the game to begin it
     * @returns {Q.Promise}
     */
    public beginGame(player: string): Q.Promise<GameAssociationResponse> {
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
     * @param gameHistoryID
     * @returns {CribbageServiceResponse}
     */
    public describe(gameHistoryID: number): CribbageServiceResponse {
        return this.activeGames.describe(gameHistoryID);
    }

    /**
     * Get the given player's hand from their active game
     * @param player
     * @returns {CribbageHandResponse}
     */
    public getPlayerHand(player: string): Q.Promise<CribbageHandResponse> {
        return new Q.Promise((resolve) => {
            this.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    resolve(this.activeGames.getPlayerHand(result, player));
                });
        });
    }

    /**
     * Play a card for the given player
     * @param player
     * @param card
     */
    public playCard(player: string, card: BaseCard): Q.Promise<CribbageReturnResponse> {
        return new Q.Promise((resolve) => {
            this.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    resolve(this.activeGames.playCard(result, player, card));
                });
        });
    }

    /**
     * Get the given player's current game
     * @param player
     */
    public getPlayerGame(player: string): Q.Promise<CurrentGameResponse> {
        var that = this;
        return new Q.Promise((resolve) => {
            this.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    resolve(that.activeGames.getPlayerGame(result));
                });
        });
    }

    /**
     * Give the players card(s) to the crib
     * @param player
     * @param cards
     */
    public giveToKitty(player: string, cards: Array<BaseCard>): Q.Promise<CribbageReturnResponse> {
        var that = this;
        return new Q.Promise((resolve) => {
            this.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    resolve(that.activeGames.giveToKitty(result, player, cards));
                });
        });
    }

    /**
     * Let the given player 'go' in the game
     * @param player
     */
    public go(player: string): Q.Promise<CribbageReturnResponse> {
        var that = this;
        return new Q.Promise((resolve) => {
            this.getPlayerID(player)
                .then((result:number) => {
                    CribbageService.checkPlayerID(result, resolve);
                    resolve(that.activeGames.go(result, player));
                });
        });
    }
}