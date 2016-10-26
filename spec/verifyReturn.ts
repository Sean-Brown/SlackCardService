import {DBReturn, DBReturnStatus} from "../db/abstraction/return/db_return";

export function verifyReturn<ReturnType>(ret:DBReturn<ReturnType>, resultIsNullMsg:string) {
    expect(ret.status).toEqual(DBReturnStatus.ok);
    expect(ret.first()).not.toBeNull(resultIsNullMsg);
}