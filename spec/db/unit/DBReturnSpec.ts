/// <reference path="../../../typings/index.d.ts" />

import {DBReturn, DBReturnStatus} from "../../../db/db_return";

class Random {
    constructor(public id:number, public name:string) { }
}
class RandomReturn extends DBReturn<Random> { }

describe("Test the DBReturn object", function() {
    it("default initializes with an ok status and an empty array of objects", function() {
        var ret = new RandomReturn();
        expect(ret.status).toEqual(DBReturnStatus.ok);
        expect(ret.result).not.toBeNull();
        expect(ret.result.length).toEqual(0);
    });
    it("returns a null first object if the array is empty", function() {
        var ret = new RandomReturn();
        expect(ret.first()).toBeNull();
    });
    it("returns the first object in the array", function() {
        var game:string = "basketball";
        var ret = new RandomReturn(DBReturnStatus.ok, [new Random(1, game)]);
        expect(ret.first()).not.toBeNull();
        expect(ret.first().name).toBe(game);
    });
});