import {GameHistoryPlayerPivot} from "../../../../db/abstraction/tables/game_history_player";
import {player_actions} from "../../../../db/implementation/postgres/player_actions";
import {CribbageHandHistory} from "../../../../db/abstraction/tables/cribbage_hand_history";
import {cribbage_hand_history_actions} from "../../../../db/implementation/postgres/cribbage_hand_history_actions";
import {
    CribbageServiceResponse, makeErrorResponse, GetPlayerPointsResponse, GameAssociationResponse,
    FindPlayersInGameResponse, checkResponse, FindPlayersResponse, FindDealerResponse
} from "./response";
import {getErrorMessage} from "../../../lib";
import {Cribbage} from "../../../../card_service/implementations/cribbage";
import {Players} from "../../../../card_service/base_classes/card_game";
import {CribbagePlayer} from "../../../../card_service/implementations/cribbage_player";
import {CribbageHand} from "../../../../card_service/implementations/cribbage_hand";
import {GameAssociation} from "./game_association";
import {CribbageHandHistoryReturn, DBReturnStatus, PlayerReturn} from "../../../../db/abstraction/return/db_return";
import {getTableName, DBTables, BaseTable} from "../../../../db/abstraction/tables/base_table";
import {pg_mgr, PGQueryReturn} from "../../../../db/implementation/postgres/manager";
var Q = require("q");

/**
 * Find all the playerIDs that were part of a game
 * @param gameHistoryID the game the playerIDs were in
 * @returns {Q.Promise} if successful, a response with the player IDs in order, otherwise an error message
 */
function findPlayersInGame(gameHistoryID:number): Q.Promise<FindPlayersInGameResponse> {
    return new Q.Promise((resolve) => {
        var response = new FindPlayersInGameResponse();
        var query = `
                SELECT ${GameHistoryPlayerPivot.COL_PLAYER_ID}
                FROM ${getTableName(DBTables.GameHistoryPlayer)}
                WHERE ${GameHistoryPlayerPivot.COL_GAME_HISTORY_ID}=${gameHistoryID}
                ORDER BY ${GameHistoryPlayerPivot.COL_ID} ASC;
            `.trim();
        pg_mgr.runQuery(query)
            .then((result:PGQueryReturn) => {
                if (result.error.length > 0) {
                    // Got an error
                    response = <FindPlayersInGameResponse>makeErrorResponse(result.error);
                }
                else {
                    // Add the playerIDs
                    result.value.rows.forEach((ghp:GameHistoryPlayerPivot) => {
                        response.playerIDs.push(ghp.player_id);
                    });
                }
                resolve(response);
            });
    });
}

/**
 * Find the playerIDs corresponding with each player ID
 * @param playerIDs the IDs of the playerIDs in the game -- IN ORDER of which player went first, second, etc.
 * @returns {Q.Promise} all the playerIDs with the order preserved, or an error message if something went wrong
 */
function findPlayers(playerIDs:Array<number>): Q.Promise<FindPlayersResponse> {
    return new Q.Promise((resolve) => {
        var response = new FindPlayersResponse();
        var promises = [];
        for (let ix = 0; ix < playerIDs.length; ix++) {
            promises.push(player_actions.find(playerIDs[ix]));
        }
        let errors = [];
        Q.Promise.all(promises)
            .then((results:Array<PlayerReturn>) => {
                // Make sure to add the playerIDs to the game in the correct order!!
                for (let ix = 0; ix < playerIDs.length; ix++) {
                    let playerID = playerIDs[ix];
                    // Find the corresponding player
                    for (let jx = 0; jx < results.length; jx++) {
                        let result = results[jx];
                        let player = result.first();
                        if (player == null) {
                            // Finding that player in the database failed
                            if (result.message.length == 0) {
                                result.message = `Unable to find player ${playerID} in the database`;
                            }
                            // Push the error
                            errors.push(result.message);
                        }
                        else if (player.id == playerID) {
                            // Found the player!
                            response.playerIDs.push(player);
                            break;
                        }
                    }
                }
                // Join all messages together with a newline and remove the last newline
                response.message = getErrorMessage(errors);
                resolve(response);
            });
    });
}

/**
 * Find the dealer based on the hand history
 * @param players the association between a player name and a player ID
 * @param gameAssociation
 * @returns {Q.Promise}
 */
function findDealer(players:Map<string, number>, gameAssociation:GameAssociation): Q.Promise<FindDealerResponse> {
    return new Q.Promise((resolve) => {
        var response = new CribbageServiceResponse();
        // This query finds the last dealer
        var query = `
                SELECT TOP ${CribbageHandHistory.COL_PLAYER_ID}
                FROM ${getTableName(DBTables.CribbageHandHistory)}
                WHERE ${CribbageHandHistory.COL_GAME_HISTORY_ID}=${gameAssociation.gameHistoryID} AND ${CribbageHandHistory.COL_IS_CRIB}=true
                ORDER BY ${CribbageHandHistory.COL_ID} DESC
                LIMIT 1;
            `.trim();
        pg_mgr.runQuery(query)
            .then((result:PGQueryReturn) => {
                if (result.error.length > 0) {
                    response = makeErrorResponse(result.error);
                }
                if (result.value.rowCount == 0) {
                    // No rows means that no hands have been played yet, so use the first player as the dealer
                    resolve(players.get((<CribbagePlayer>gameAssociation.game.players.itemAt(0)).name))
                }
                else {
                    // Found the dealer, now find out who the next dealer should be
                    resolve(result.value.rows[0]);
                }
            });
        resolve(response);
    });
}

/**
 * Find the player name given the player ID
 * @param players the association between a player name and a player ID
 * @param playerID
 * @returns string the name of the player
 */
function findPlayerName(players:Map<string, number>, playerID:number): string {
    let playerName = "";
    players.forEach((value:number /* id */, key:string /* name */) => {
        if (value == playerID) {
            playerName = key;
        }
    });
    return playerName;
}

/**
 * Set the dealer and next player
 * @param players the association between a player name and a player ID
 * @param gameAssociation
 * @returns {Q.Promise}
 */
function setDealerAndNextPlayer(players:Map<string, number>, gameAssociation:GameAssociation): Q.Promise<CribbageServiceResponse> {
    return new Q.Promise((resolve) => {
        findDealer(players, gameAssociation)
            .then((result:FindDealerResponse) => {
                checkResponse(result, resolve);
                // We have the dealer ID, now set the dealer and next player
                let dealerName = findPlayerName(players, result.dealerID);
                if (dealerName == "") {
                    resolve(makeErrorResponse(`Unable to find the name of player ${result.dealerID}`));
                }
                // Set the dealer in the game
                let game = gameAssociation.game;
                let gamePlayers = gameAssociation.game.players;
                for (let ix = 0; ix < gamePlayers.countItems(); ix++) {
                    let player = <CribbagePlayer>gamePlayers[ix];
                    if (player.name == dealerName) {
                        // Found the dealer, now set the dealer and the next player
                        game.dealer = player;
                        game.nextPlayerInSequence = game.nextPlayerInOrder(player);
                    }
                }
            });
    });
}

/**
 * Get the number of points the player has so far in the given game
 * @param playerID
 * @param gameHistoryID
 * @returns {Q.Promise}
 */
function getPlayerPoints(playerID:number, gameHistoryID:number): Q.Promise<GetPlayerPointsResponse> {
    return new Q.Promise((resolve) => {
        // Find the players points
        cribbage_hand_history_actions.getPoints(playerID, gameHistoryID)
            .then((result:CribbageHandHistoryReturn) => {
                checkResponse(result, resolve);
                let points = 0;
                if (result.first() != null) {
                    points = result.first().points;
                }
                resolve(new GetPlayerPointsResponse(playerID, points));
            });
    });
}

/**
 * Set each player's points in the given game
 * @param players the association between a player name and a player ID
 * @param gameAssociation
 * @returns {Q.Promise}
 */
function setPlayerPoints(players:Map<string, number>, gameAssociation:GameAssociation): Q.Promise<CribbageServiceResponse> {
    return new Q.Promise((resolve) => {
        let promises = [];
        let gameHistoryID = gameAssociation.gameHistoryID;
        gameAssociation.playerIDs.forEach((playerID:number) => {
            promises.push(getPlayerPoints(playerID, gameHistoryID));
        });
        Q.Promise.all(promises).then((results:Array<GetPlayerPointsResponse>) => {
            let errors = [];
            results.forEach((result:GetPlayerPointsResponse) => {
                if (result.status != DBReturnStatus.ok) {
                    errors.push(result.message);
                }
                else {
                    // Set the player's points in the game
                    let playerName = findPlayerName(players, result.playerID);
                    gameAssociation.game.players.findPlayer(playerName).points = result.points;
                }
            });
            let message = getErrorMessage(errors);
            if (message.length > 0) {
                resolve(makeErrorResponse(message));
            }
            else {
                resolve(new CribbageServiceResponse());
            }
        });
    });
}

/**
 * Recreate the game given the game-history ID number
 * @param players the association between a player name and a player ID -- this variable is used as reference to
 * find the player name, it is not the set of players in the game
 * @param gameHistoryID
 * @returns {Q.Promise} a promise for the recreated game or null if there was an error
 */
export function recreateGame(players:Map<string, number>, gameHistoryID:number): Q.Promise<GameAssociationResponse> {
    return new Q.Promise((resolve) => {
        var response = new GameAssociationResponse();
        let gameAssociation = new GameAssociation(new Cribbage(new Players([])), gameHistoryID);
        // Find the playerIDs in the game
        findPlayersInGame(gameHistoryID)
            .then((result: FindPlayersInGameResponse) => {
                checkResponse(result, resolve);
                // Set the playerIDs in the association
                result.playerIDs.forEach((playerID:number) => {
                    gameAssociation.playerIDs.add(playerID);
                });
                // Recreate each player from the database
                return findPlayers(result.playerIDs);
            })
            .then((result: FindPlayersResponse) => {
                checkResponse(result, resolve);
                // Create CribbagePlayer items and add them to the game in the association
                let cribbagePlayers = [];
                for (let ix = 0; ix < result.playerIDs.length; ix++) {
                    let player = result.playerIDs[ix];
                    cribbagePlayers.push(new CribbagePlayer(player.name, new CribbageHand([])));
                }
                gameAssociation.game.players = new Players(cribbagePlayers);
                // Set the dealer and next player
                return setDealerAndNextPlayer(players, gameAssociation);
            })
            .then((result: CribbageServiceResponse) => {
                checkResponse(result, resolve);
                // Set each players points
                return setPlayerPoints(players, gameAssociation);
            })
            .then((result: CribbageServiceResponse) => {
                checkResponse(result, resolve);
                // Make the teams
                gameAssociation.game.makeTeams();
                // Set the game as 'begun'
                gameAssociation.game.hasBegun = true;
                // Set the association
                response.gameAssociation = gameAssociation;
                resolve(response);
            });
    });
}
