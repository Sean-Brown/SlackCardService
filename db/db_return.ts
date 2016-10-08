/**
 * The Database Return Status codes
 * TODO add a bunch more DB status codes
 */
import {CribbageHandHistoryTable} from "./models/cribbage_hand_history";
import {GameTable} from "./models/game";
import {GameHistoryTable} from "./models/game_history";
import {PlayerTable} from "./models/player";
import {WinLossHistoryTable} from "./models/win_loss_history";
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
 * <TableClass> is the Typescript class of
 * the database table (under ../tables)
 */
export class DBReturn<TableClass> extends BaseDBReturn {
    /**
     * The return object
     */
    result:Array<TableClass>;
    constructor(status:DBReturnStatus=DBReturnStatus.ok, objs:Array<TableClass>=[]) {
        super(status);
        if (objs != null) {
            this.result = objs;
        }
        else {
            this.result = [];
        }
    }
    public first():TableClass {
        var ret:TableClass = null;
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

export class CribbageHandHistoryReturn extends DBReturn<CribbageHandHistoryTable> { }
export class GameReturn extends DBReturn<GameTable> { }
export class GameHistoryReturn extends DBReturn<GameHistoryTable> { }
export class PlayerReturn extends DBReturn<PlayerTable> { }
export class WinLossHistoryReturn extends DBReturn<WinLossHistoryTable> { }