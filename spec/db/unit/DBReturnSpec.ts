/// <reference path="../../../typings/index.d.ts" />

import {GameReturn, DBReturnStatus} from "../../../db/db_return";
import {Game} from "../../../db/tables/game";

describe("Test the DBReturn object", function() {
    it("default initializes with an ok status and an empty array of objects", function() {
        var ret = new GameReturn();
        expect(ret.status).toEqual(DBReturnStatus.ok);
        expect(ret.result).not.toBeNull();
        expect(ret.result.length).toEqual(0);
    });
    it("returns a null first object if the array is empty", function() {
        var ret = new GameReturn();
        expect(ret.first()).toBeNull();
    });
    it("returns the first object in the array", function() {
        var game:string = "basketball";
        var ret = new GameReturn(DBReturnStatus.ok, [new Game(1, game)]);
        expect(ret.first()).not.toBeNull();
        expect(ret.first().name).toBe(game);
    });
});