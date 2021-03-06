import {deleteTables} from "./CreateTablesSpec";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {Game} from "../../../../db/abstraction/tables/game";
import {createGame} from "./GameActionsSpec";
import {verifyReturn} from "../../../verifyReturn";
import {readConfigFromEnv} from "./setEnv";
import {GameHistory} from "../../../../db/abstraction/tables/game_history";
import {createGameHistory} from "./GameHistoryActionsSpec";
import {Player} from "../../../../db/abstraction/tables/player";
import {createPlayer} from "./PlayerActionsSpec";
import {GameHistoryPlayerPivot} from "../../../../db/abstraction/tables/game_history_player";
import {game_history_player_actions} from "../../../../db/implementation/postgres/game_history_player_actions";
import {GameHistoryPlayerReturn, DBReturnStatus} from "../../../../db/abstraction/return/db_return";
var Q = require("q");

function createGameHistoryPlayer(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerPivot> {
    return new Q.Promise((resolve, reject) => {
        game_history_player_actions.createAssociation(player_id, game_history_id)
            .then((ret: GameHistoryPlayerReturn) => {
                verifyReturn(ret, "Expected a game-history-player return value");
                resolve(ret.first());
            })
            .catch((ret: GameHistoryPlayerReturn) => {
                expect(ret.first()).toBeNull("Should have returned a null result");
                reject(null);
            });
    });
}
describe("Test the 'game-history-player' actions", function() {
    var player:Player = null;
    var game:Game = null;
    var gameHistory:GameHistory = null;
    beforeEach(function(done) {
        readConfigFromEnv();
        // Create the tables
        PostgresTables.createTables()
            .then(() => {
                return createGame();
            })
            .then((result:Game) => {
                game = result;
                return createPlayer();
            })
            .then((result:Player) => {
                player = result;
                return createGameHistory(game.id);
            })
            .then((result:GameHistory) => {
                gameHistory = result;
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can create the game-history-player association", function(done) {
        createGameHistoryPlayer(player.id, gameHistory.id)
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can create multiple game-history-player associations", function(done) {
        createPlayer("Tesla")
            .then((result:Player) => {
                return game_history_player_actions.createAssociations([
                    player.id, result.id
                ], gameHistory.id);
            })
            .then((result:GameHistoryPlayerReturn) => {
                expect(result.status).toEqual(DBReturnStatus.ok);
                expect(result.result.length).toEqual(2);
            })
            .catch(() => {
                fail("The test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find the game-history-player assocation", function(done) {
        createGameHistoryPlayer(player.id, gameHistory.id)
            .then(() => {
                return game_history_player_actions.findAssociation(player.id, gameHistory.id);
            })
            .then((result:GameHistoryPlayerReturn) => {
                verifyReturn(result, "Expected a game-history-player return value");
            })
            .catch(() => {
                fail("The test should have succeeded");
            })
            .finally(() => { done(); });
    });
});