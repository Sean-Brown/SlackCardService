/// <reference path="../../../../typings/index.d.ts" />

import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {game_actions} from "../../../../db/implementation/postgres/game_actions";
import {readConfigFromEnv} from "./setEnv";
import {deleteTables} from "./CreateTablesSpec";
import {GameReturn, DBReturnStatus, DBReturn} from "../../../../db/abstraction/return/db_return";
import {Game} from "../../../../db/abstraction/tables/game";
var Q = require("q");

// Create an entry in the game table
export const game = "cribbage";
/**
 * Create a row for the game in the database
 * @returns the Game object for that row
 */
export function createGame(): Q.Promise<Game> {
    return new Q.Promise((resolve, reject) => {
        game_actions.create(game)
            .then((ret: GameReturn) => {
                verifyReturn(ret, "Expected a result from creating a game");
                resolve(ret.first());
            })
            .catch((ret: GameReturn) => {
                expect(ret.first).toBeNull("Should have returned a null result");
                reject(null);
            });
    });
}
export function verifyReturn<ReturnType>(ret:DBReturn<ReturnType>, resultIsNullMsg:string) {
    expect(ret.status).toEqual(DBReturnStatus.ok);
    expect(ret.first()).not.toBeNull(resultIsNullMsg);
}
describe("Test the 'game' actions", function() {
    beforeEach(function(done) {
        readConfigFromEnv();
        PostgresTables.createTables().finally(() => { done(); });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can create a new game entry", function(done) {
        createGame()
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find a created game entry", function(done) {
        createGame()
            .then((result:Game) => {
                return game_actions.find(result.id);
            })
            .then((result:GameReturn) => {
                verifyReturn(result, "Expected a result from finding a game");
                expect(result.first().name).toBe(game);
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find a created game by name", function(done) {
        createGame()
            .then((result:Game) => {
                return game_actions.findByName(result.name);
            })
            .then((result:GameReturn) => {
                verifyReturn(result, "Expected a result from finding a game by name");
                expect(result.first().name).toBe(game);
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    // TODO test error cases
});
