import { Players } from '../../../../card_service/base_classes/card_game';
import { BaseCard } from '../../../../card_service/base_classes/items/card';
import { Cribbage } from '../../../../card_service/implementations/cribbage';
import { CribbageHand } from '../../../../card_service/implementations/cribbage_hand';
import { CribbagePlayer } from '../../../../card_service/implementations/cribbage_player';
import { CribbageHandHistoryActions } from '../../../../db/actions/cribbage_hand_history_actions';
import { PlayerActions } from '../../../../db/actions/player_actions';
import CribbageHandHistory from '../../../../db/models/cribbage_hand_history';
import GameHistoryPlayer from '../../../../db/models/game_history_player';
import Player from '../../../../db/models/player';
import { getErrorMessage } from '../../../lib';
import { ResponseCode } from '../../../response_code';
import { CribbageRoutes } from '../../Index';
import { CribbageService } from '../cribbage_service';
import { GameAssociation } from './game_association';
import {
    CribbageServiceResponse, FindDealerResponse, FindPlayersInGameResponse, FindPlayersResponse,
    GameAssociationResponse, GetPlayerPointsResponse, makeErrorResponse, SetPlayerHandsResponse
} from './response';

/**
 * Find all the playerIDs that were part of a game
 * @param gameHistoryId the game the playerIDs were in
 * @param players the map of a player's name to their id, potentially fill this map out with missing players
 * @returns {Promise} if successful, a response with the player IDs in order, otherwise an error message
 */
async function findPlayersInGame(gameHistoryId: number, players: Map<string, number>): Promise<FindPlayersInGameResponse> {
    let response = new FindPlayersInGameResponse();
    try {
        const results = await GameHistoryPlayer.findAll({
            attributes: ['id'],
            include: [{
                model: Player,
                attributes: ['name']
            }],
            where: { gameHistoryId }
        });
        // Add the playerIDs
        for (const composite of results) {
            CribbageService.setPlayer(players, composite.get('name'), composite.playerId);
            response.playerIDs.push(composite.playerId);
        }
    }
    catch (e) {
        response = <FindPlayersInGameResponse>makeErrorResponse(`Error finding the players in game ${gameHistoryId}`);
    }
    return response;
}

/**
 * Find the playerIDs corresponding with each player ID
 * @param playerIDs the IDs of the playerIDs in the game -- IN ORDER of which player went first, second, etc.
 * @returns {Promise} all the playerIDs with the order preserved, or an error message if something went wrong
 */
async function findPlayers(playerIDs: Array<number>): Promise<FindPlayersResponse> {
    const response = new FindPlayersResponse();
    const promises = [];
    for (let ix = 0; ix < playerIDs.length; ix++) {
        promises.push(PlayerActions.findById(playerIDs[ix]));
    }
    const errors = [];
    const results = await Promise.all(promises);
    // Make sure to add the playerIDs to the game in the correct order!!
    for (let ix = 0; ix < playerIDs.length; ix++) {
        const playerID = playerIDs[ix];
        // Find the corresponding player
        for (let jx = 0; jx < results.length; jx++) {
            const result = results[jx];
            const player = result.first();
            if (player === null) {
                // Finding that player in the database failed
                if (result.message.length === 0) {
                    result.message = `Unable to find player ${playerID} in the database`;
                }
                // Push the error
                errors.push(result.message);
            }
            else if (player.id === playerID) {
                // Found the player!
                response.players.push(player);
                break;
            }
        }
    }
    // Join all messages together with a newline and remove the last newline
    response.message = getErrorMessage(errors);
    response.status = (response.message.length > 0 ? ResponseCode.error : ResponseCode.ok);
    return response;
}

/**
 * Find who the last dealer in the game was, if there was one
 * @param gameHistoryID
 * @returns the name of the last dealer, or an empty string if there was no last dealer
 */
async function findLastDealer(gameHistoryID: number): Promise<string> {
    let player = '';
    try {
        const result = await CribbageHandHistory.findOne({
            include: [{
                model: Player,
                attributes: ['name']
            }],
            where: {
                id: gameHistoryID,
                isCrib: true
            },
            order: [['id', 'DESC']]
        });
        if (result) {
            player = result.get('name');
        }
    }
    catch (e) {
        console.log(`error finding the last dealer for game ${gameHistoryID}`);
    }
    return player;
}

/**
 * Find the dealer based on the hand history
 * @param players the association between a player name and a player ID
 * @param gameAssociation
 * @returns {Promise}
 */
async function findDealer(players: Map<string, number>, gameAssociation: GameAssociation): Promise<FindDealerResponse> {
    const response = new FindDealerResponse(CribbageService.INVALID_ID);
    try {
        const result = await CribbageHandHistory.findOne({
            where: {
                gameHistoryId: gameAssociation.gameHistoryID,
                isCrib: true,
                played: false
            },
            order: [['id', 'DESC']]
        });
        if (!result) {
            // No rows means that no hands have been played yet, find who the last dealer was
            const prevDealerName = await findLastDealer(gameAssociation.gameHistoryID);
            const game = gameAssociation.game;
            if (prevDealerName.length > 0) {
                // Find the next dealer based on the previous dealer
                const prevDealer = game.players.findPlayer(prevDealerName);
                const nextDealer = game.nextPlayerInOrder(prevDealer);
                response.dealerID = players.get(nextDealer.name);
            }
            else {
                // Set the dealer to the first player
                const gamePlayers = game.players;
                if (gamePlayers.countItems() > 0) {
                    const dealer = <CribbagePlayer>game.players.itemAt(0);
                    response.dealerID = players.get(dealer.name);
                }
                else {
                    response.dealerID = CribbageService.INVALID_ID;
                    response.status = ResponseCode.error;
                }
            }
        }
        else {
            // Found the dealer, now find out who the next dealer should be
            response.dealerID = result.playerId;
        }
    }
    catch (e) {
        console.log(`error getting the last dealer for game ${gameAssociation.gameHistoryID}`);
    }
    return response;
}

/**
 * Find the player name given the player ID
 * @param players the association between a player name and a player ID
 * @param playerID
 * @returns string the name of the player
 */
function findPlayerName(players: Map<string, number>, playerID: number): string {
    let playerName = '';
    players.forEach((value: number /* id */, key: string /* name */) => {
        if (value === playerID) {
            playerName = key;
        }
    });
    return playerName;
}

/**
 * Set the dealer and next player
 * @param players the association between a player name and a player ID
 * @param gameAssociation
 * @returns {Promise}
 */
async function setDealerAndNextPlayer(players: Map<string, number>, gameAssociation: GameAssociation): Promise<CribbageServiceResponse> {
    const result = await findDealer(players, gameAssociation);
    // We have the dealer ID, now set the dealer and next player
    const dealerName = findPlayerName(players, result.dealerID);
    if (dealerName === '') {
        return makeErrorResponse(`Unable to find the name of player ${result.dealerID}`);
    }
    // Set the dealer in the game
    const game = gameAssociation.game;
    const gamePlayers = gameAssociation.game.players;
    for (let ix = 0; ix < gamePlayers.countItems(); ix++) {
        const player = <CribbagePlayer>gamePlayers.itemAt(ix);
        if (player.name === dealerName) {
            // Found the dealer, now set the dealer and the next player
            game.dealer = player;
            game.nextPlayerInSequence = game.nextPlayerInOrder(player);
            break;
        }
    }
    return new CribbageServiceResponse();
}

/**
 * Get the number of points the player has so far in the given game
 * @param playerID
 * @param gameHistoryID
 * @returns {Promise}
 */
async function getPlayerPoints(playerID: number, gameHistoryID: number): Promise<GetPlayerPointsResponse> {
    let points = 0;
    try {
        // Find the players points
        const result = await CribbageHandHistoryActions.getPoints(gameHistoryID, playerID);
        points = result.points;
    }
    catch (e) {
        console.log(`error getting the points for player ${playerID} in game ${gameHistoryID}`);
    }
    return new GetPlayerPointsResponse(playerID, points);
}

/**
 * Set each player's points in the given game
 * @param players the association between a player name and a player ID
 * @param gameAssociation
 * @returns {Promise}
 */
async function setPlayerPoints(players: Map<string, number>, gameAssociation: GameAssociation): Promise<CribbageServiceResponse> {
    const promises = [];
    const gameHistoryID = gameAssociation.gameHistoryID;
    gameAssociation.playerIDs.forEach((playerID: number) => {
        promises.push(getPlayerPoints(playerID, gameHistoryID));
    });
    const results = await Promise.all(promises);
    const errors = [];
    results.forEach((result: GetPlayerPointsResponse) => {
        if (result.status !== ResponseCode.ok) {
            errors.push(result.message);
        }
        else {
            // Set the player's points in the game
            const playerName = findPlayerName(players, result.playerID);
            const player = gameAssociation.game.players.findPlayer(playerName);
            player.points = result.points;
        }
    });
    const message = getErrorMessage(errors);
    if (message.length > 0) {
        return makeErrorResponse(message);
    }
    else {
        return new CribbageServiceResponse();
    }
}

async function getPlayerUnplayedHand(gameHistoryID: number, playerID: number): Promise<SetPlayerHandsResponse> {
    try {
        const result = await CribbageHandHistoryActions.getLastHand(gameHistoryID, playerID);
        // Parse the cards into a hand
        const cards: Array<BaseCard> = CribbageRoutes.Router.parseCards(result.hand);
        return new SetPlayerHandsResponse(playerID, new CribbageHand(cards));
    }
    catch (e) {
        const message = `error getting the unplayed hand for player ${playerID} in game ${gameHistoryID}`;
        console.log(message + e);
        return <SetPlayerHandsResponse>makeErrorResponse(message);
    }
}

async function setPlayerHands(players: Map<string, number>, gameAssociation: GameAssociation): Promise<CribbageServiceResponse> {
    const hasUnplayedHands = CribbageHandHistoryActions.hasUnplayedHands(gameAssociation.gameHistoryID);
    if (hasUnplayedHands) {
        // Load the unplayed hands
        const promises = [];
        const gameHistoryID = gameAssociation.gameHistoryID;
        gameAssociation.playerIDs.forEach((playerID: number) => {
            promises.push(getPlayerUnplayedHand(playerID, gameHistoryID));
        });
        const results = await Promise.all(promises);
        const errors = [];
        results.forEach((result: SetPlayerHandsResponse) => {
            if (result.status !== ResponseCode.ok) {
                errors.push(result.message);
            }
            else {
                // Set the player's hand in the game
                const playerName = findPlayerName(players, result.playerID);
                const player = <CribbagePlayer>gameAssociation.game.players.findPlayer(playerName);
                player.hand = result.hand;
                // Remove the cards from the game's deck
                for (let ix = 0; ix < player.hand.countItems(); ix++) {
                    gameAssociation.game.deck.removeItem(player.hand.itemAt(ix));
                }
            }
        });
        const message = getErrorMessage(errors);
        if (message.length > 0) {
            return makeErrorResponse(message);
        }
        else {
            return new CribbageServiceResponse();
        }
    }
    else {
        // Just deal the cards
        gameAssociation.game.deal();
        return new CribbageServiceResponse();
    }
}

/**
 * Recreate the game given the game-history ID number
 * @param gameHistoryID
 * @param players the association between a player name and a player ID -- this variable is used as reference to
 * find the player name, it is not the set of players in the game
 * @returns {Promise} a promise for the recreated game or null if there was an error
 */
export async function recreateGame(gameHistoryID: number, players: Map<string, number>): Promise<GameAssociationResponse> {
    const response = new GameAssociationResponse();
    const gameAssociation = new GameAssociation(new Cribbage(new Players([])), gameHistoryID);

    // Find the playerIDs in the game
    const findPlayersInGameResult = await findPlayersInGame(gameHistoryID, players);
    // Set the playerIDs in the association
    findPlayersInGameResult.playerIDs.forEach((playerID: number) => {
        gameAssociation.playerIDs.add(playerID);
    });

    // Recreate each player from the database
    const findPlayersResult = await findPlayers(findPlayersInGameResult.playerIDs);
    // Create CribbagePlayer items and add them to the game in the association
    const cribbagePlayers = [];
    for (let ix = 0; ix < findPlayersResult.players.length; ix++) {
        const player = findPlayersResult.players[ix];
        cribbagePlayers.push(new CribbagePlayer(player.name, new CribbageHand([])));
    }
    gameAssociation.game.players = new Players(cribbagePlayers);
    gameAssociation.game.numPlayers = gameAssociation.game.players.countItems();

    // Set the dealer and next player
    await setDealerAndNextPlayer(players, gameAssociation);
    // Set each players points
    await setPlayerPoints(players, gameAssociation);
    // Make the teams
    gameAssociation.game.makeTeams();
    // Set the player hands
    await setPlayerHands(players, gameAssociation);
    // Set the game as 'begun'
    gameAssociation.game.hasBegun = true;
    // Set the association
    response.gameAssociation = gameAssociation;
    return response;
}
