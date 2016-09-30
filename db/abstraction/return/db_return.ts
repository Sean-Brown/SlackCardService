import {Game} from "../tables/game";
import {GameHistory} from "../tables/game_history";
import {GameHistoryPlayerPivot} from "../tables/game_history_player";
import {HandHistory} from "../tables/hand_history";
import {Player} from "../tables/player";
import {WinLossHistory} from "../tables/win_loss_history";

/**
 * The Database Return Status codes
 * TODO add a bunch more DB status codes
 */
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
class DBReturn<TableClass> extends BaseDBReturn {
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
}

export class GameReturn extends DBReturn<Game> { }
export class GameHistoryReturn extends DBReturn<GameHistory> { }
export class GameHistoryPlayerReturn extends DBReturn<GameHistoryPlayerPivot> { }
export class HandHistoryReturn extends DBReturn<HandHistory> { }
export class PlayerReturn extends DBReturn<Player> { }
export class WinLossHistoryReturn extends DBReturn<WinLossHistory> { }