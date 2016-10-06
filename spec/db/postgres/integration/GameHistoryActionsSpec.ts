import {deleteTables} from "./CreateTablesSpec";
import {readConfigFromEnv} from "./setEnv";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {createGame, verifyReturn} from "./GameActionsSpec";
import {Game} from "../../../../db/abstraction/tables/game";
import {GameHistory} from "../../../../db/abstraction/tables/game_history";
import {GameHistoryReturn, DBReturnStatus, GameHistoryPlayerReturn} from "../../../../db/abstraction/return/db_return";
import {game_history_actions} from "../../../../db/implementation/postgres/game_history_actions";
import {createPlayer} from "./PlayerActionsSpec";
import {Player} from "../../../../db/abstraction/tables/player";
import {game_history_player_actions} from "../../../../db/implementation/postgres/game_history_player_actions";
var Q = require("q");

/**
 * Create a row for the game-history in the database
 * @returns the game-history object for that row
 */
export function createGameHistory(game_id:number): Q.Promise<GameHistory> {
    return new Q.Promise((resolve) => {
        game_history_actions.create(game_id).then((ret: GameHistoryReturn) => {
            verifyReturn(ret, "Expected a result from creating the game-history");
            resolve(ret.first());
        });
    });
}
describe("Test the 'game-history' actions", function() {
    var game:Game = null;
    beforeEach(function(done) {
        readConfigFromEnv();
        // Asynchronously drop the schema
        deleteTables().then(() => {
            // Re-create the tables to start from a fresh slate
            PostgresTables.createTables()
                .then(() => {
                    // Before beginning, create a game and save it
                    return createGame();
                })
                .then((result:Game) => { game = result; })
                .finally(() => { done(); });
        });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can create a game-history entry", function(done) {
        createGameHistory(game.id).finally(() => { done(); });
    });
    it("can find the most recent game-history entry", function(done) {
        var gameHistory = null;
        createGameHistory(game.id)
            .then((result:GameHistory) => {
                gameHistory = result;
                return game_history_actions.findMostRecent(game.id);
            })
            .then((result:GameHistoryReturn) => {
                verifyReturn(result, "Expected a game-history result");
                expect(result.first().id).toEqual(gameHistory.id);
            })
            .finally(() => { done(); });
    });
    it("can find the most recent game-history entry", function(done) {
        var gh1:GameHistory, gh2:GameHistory = null;
        createGameHistory(game.id)
            .then((result:GameHistory) => {
                gh1 = result;
                return createGameHistory(game.id);
            })
            .then((result:GameHistory) => {
                gh2 = result;
                expect(gh1.id).toBeLessThan(gh2.id);
                expect(gh1.began).toBeLessThan(gh2.began);
                return game_history_actions.findMostRecent(game.id);
            })
            .then((result:GameHistoryReturn) => {
                verifyReturn(result, "Expected a game-history result");
                expect(result.first().id).toEqual(gh2.id);
            })
            .finally(() => { done(); });
    });
    it("can find the most recent game-history entry that has not yet ended", function(done) {
        var gh1:GameHistory, gh2:GameHistory = null;
        createGameHistory(game.id)
            .then((result:GameHistory) => {
                gh1 = result;
                return createGameHistory(game.id);
            })
            .then((result:GameHistory) => {
                gh2 = result;
                expect(gh1.id).toBeLessThan(gh2.id);
                expect(gh1.began).toBeLessThan(gh2.began);
                // End game 2
                return game_history_actions.endGame(gh2.id);
            })
            .then((result:GameHistoryReturn) => {
                expect(result.status).toEqual(DBReturnStatus.ok);
                // Finding the most recent game history should now return game-history 1
                return game_history_actions.findMostRecent(game.id);
            })
            .then((result:GameHistoryReturn) => {
                verifyReturn(result, "Expected a game-history result");
                expect(result.first().id).toEqual(gh1.id, "The most recent game-history result should have been the first game since that one has not yet ended");
            })
            .finally(() => { done(); });
    });
    it("can end a game", function(done) {
        var gh = null;
        createGameHistory(game.id)
            .then((result:GameHistory) => {
                gh = result;
                return game_history_actions.endGame(gh.id);
            })
            .then((result:GameHistoryReturn) => {
                verifyReturn(result, "Expected a game-history result");
                expect(result.first().id).toEqual(gh.id);
                expect(result.first().ended).not.toBeNull("Expected an 'ended' timestamp");
                expect(result.first().began).toBeLessThan(result.first().ended, "Expected the game to end AFTER it began");
            })
            .finally(() => { done(); });
    });
    it("can find the game history records associated with a player for a specific game", function(done) {
        var gh = null, player = null;
        createGameHistory(game.id)
            .then((result:GameHistory) => {
                gh = result;
                return createPlayer();
            })
            .then((result:Player) => {
                player = result;
                return game_history_player_actions.createAssociation(player.id, gh.id);
            })
            .then((result:GameHistoryPlayerReturn) => {
                verifyReturn(result, "Expected a game-history-player result");
                return game_history_actions.find(player.name, gh.id);
            })
            .then((result:GameHistoryReturn) => {
                verifyReturn(result, "Expected a game-history result");
                expect(result.first().id).toEqual(gh.id);
            })
            .finally(() => { done(); });
    });
    // TODO test more error cases
});