/**
 * The Database Return Status codes
 * TODO add a bunch more DB status codes
 */
import {CribbageHandHistoryModel} from "./models/cribbage_hand_history";
import {GameModel} from "./models/game";
import {GameHistoryModel} from "./models/game_history";
import {PlayerModel} from "./models/player";
import {WinLossHistoryModel} from "./models/win_loss_history";
export enum DBReturnStatus {
    ok = 0,
    error = 1
}

/**
 * Base Database return class
 */
export class BaseDBReturn {
    /**
     * The return status code
     */
    status:DBReturnStatus;
    message:string;
    constructor(status:DBReturnStatus=DBReturnStatus.ok, message:string="") {
        this.status = status;
        this.message = message;
    }
}

/**
 * The object returned from a database action
 * <ModelClass> is the Typescript class of
 * the database table (under ../tables)
 */
export class DBReturn<ModelClass> extends BaseDBReturn {
    /**
     * The return object
     */
    result:Array<ModelClass>;
    constructor(status:DBReturnStatus=DBReturnStatus.ok, objs:Array<ModelClass>=[]) {
        super(status);
        if (objs != null) {
            this.result = objs;
        }
        else {
            this.result = [];
        }
    }
    public first():ModelClass {
        var ret:ModelClass = null;
        if (this.result.length > 0) {
            ret = this.result[0];
        }
        return ret;
    }
    public setError(message:string) {
        this.result = [];
        this.status = DBReturnStatus.error;
        this.message = message;
    }
}

export class CribbageHandHistoryReturn extends DBReturn<CribbageHandHistoryModel> { }
export class GameReturn extends DBReturn<GameModel> { }
export class GameHistoryReturn extends DBReturn<GameHistoryModel> { }
export class PlayerReturn extends DBReturn<PlayerModel> { }
export class WinLossHistoryReturn extends DBReturn<WinLossHistoryModel> { }