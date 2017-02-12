import {Player} from "../../../../db/abstraction/tables/player";
import {DBReturnStatus} from "../../../../db/abstraction/return/db_return";
import {GameAssociation} from "./game_association";
import construct = Reflect.construct;
import {CribbageHand} from "../../../../card_service/implementations/cribbage_hand";
import {CribbageReturn, Cribbage} from "../../../../card_service/implementations/cribbage";

/**
 * Class that's returned from service calls
 */
export class CribbageServiceResponse {
    constructor(public status:DBReturnStatus = DBReturnStatus.ok, public message:string = "") { }
}
/**
 * Class that's returned from the "find playerIDs in game" method
 */
export class FindPlayersInGameResponse extends CribbageServiceResponse {
    constructor(public playerIDs:Array<number> = []) { super(); }
}
/** Class that's returned from the "get unfinished games" method */
export class GetUnfinishedGamesResponse extends CribbageServiceResponse {
    constructor(public gameHistoryIDs:Array<number>) { super(); }
}
/**
 * Class that's returned from the "get current game" method
 */
export class GetCurrentGameResponse extends CribbageServiceResponse {
    constructor(public gameID:number) { super(); }
}
/**
 * Class that's returned from the "find players" method
 */
export class FindPlayersResponse extends CribbageServiceResponse {
    constructor(public players:Array<Player> = []) { super(); }
}
/**
 * Class that's returned from the "find dealer" method
 */
export class FindDealerResponse extends CribbageServiceResponse {
    constructor(public dealerID:number) { super(); }
}
/**
 * Class that's returned from the "recreate game" method
 */
export class GameAssociationResponse extends CribbageServiceResponse {
    constructor(public gameAssociation:GameAssociation = null) { super(); }
}
/**
 * Class that's returned from the "getPlayerPoints" method
 */
export class GetPlayerPointsResponse extends CribbageServiceResponse {
    constructor(public playerID:number, public points:number) { super(); }
}
/**
 * Class that's returned from the "setPlayerHands" method
 */
export class SetPlayerHandsResponse extends CribbageServiceResponse {
    constructor(public playerID:number, public hand:CribbageHand) { super(); }
}
/**
 * Class that's returned from the "player in game" method
 */
export class PlayerInGameResponse extends CribbageServiceResponse {
    constructor(public partOfGame:boolean = false) { super(); }
}
/**
 * Class that's returned from the "show hand" method
 */
export class CribbageHandResponse extends CribbageServiceResponse {
    constructor(public hand:CribbageHand) { super(); }
}
/**
 * Class that's returned from the "play card" and "give to kitty" method
 */
export class CribbageReturnResponse extends CribbageServiceResponse {
    constructor(public cribRes:CribbageReturn, public game:Cribbage, public gameHistoryID:number) { super(); }
}
/**
 * Class that's returned from the "get player game" method
 */
export class CurrentGameResponse extends CribbageServiceResponse {
    constructor(public gameID:Cribbage) { super(); }
}

/**
 * Check the response value for an error message
 * @param response the response object
 * @param resolve the Q.Promise resolving function -- resolve on the error if there is one
 */
export function checkResponse<T extends CribbageServiceResponse>(response:T, resolve:Function) {
    if (response.status != DBReturnStatus.ok) {
        resolve(makeErrorResponse(response.message));
    }
}

/**
 * Make an error response
 * @param message the error message
 * @returns {CribbageServiceResponse} a response with an error response code
 */
export function makeErrorResponse(message:string): CribbageServiceResponse {
    return new CribbageServiceResponse(DBReturnStatus.error, message);
}

