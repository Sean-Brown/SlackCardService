import {deleteTables} from "./CreateTablesSpec";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {Player} from "../../../../db/abstraction/tables/player";
import {GameHistory} from "../../../../db/abstraction/tables/game_history";
import {Game} from "../../../../db/abstraction/tables/game";
import {readConfigFromEnv} from "./setEnv";
import {createGame, verifyReturn} from "./GameActionsSpec";
import {createPlayer} from "./PlayerActionsSpec";
import {createGameHistory} from "./GameHistoryActionsSpec";
import {cribbage_hand_history_actions} from "../../../../db/implementation/postgres/cribbage_hand_history_actions";
import {CribbageHandHistoryReturn} from "../../../../db/abstraction/return/db_return";
import {CribbageHandHistory} from "../../../../db/abstraction/tables/cribbage_hand_history";
import {Cribbage} from "../../../../card_service/implementations/cribbage";
var Q = require("q");

const hand = "4s-4c-5d-6s";
const cut = "6h";
function createCribbageHandHistory(player_id:number, game_history_id:number): Q.Promise<CribbageHandHistory> {
    return new Q.Promise((resolve, reject) => {
        cribbage_hand_history_actions.create(player_id, game_history_id, hand, cut)
            .then((ret: CribbageHandHistoryReturn) => {
                verifyReturn(ret, "Expected a hand-history result");
                resolve(ret.first());
            })
            .catch((ret: CribbageHandHistoryReturn) => {
                expect(ret.first()).toBeNull("No result should have been returned.");
                reject(null);
            });
    });
}
describe("Test the 'hand-history' actions", function() {
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
            .finally(() => { done(); });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can add a hand-history row", function(done) {
        createCribbageHandHistory(player.id, gameHistory.id)
            .catch(() => {
                // make the test fail
                expect(true).toBeFalsy(`Test should have succeeded`);
            })
            .finally(() => { done(); });
    });
    it("enforces player_id foreign key constraints", function(done) {
        createCribbageHandHistory(0, gameHistory.id)
            .then(() => {
                // make the test fail
                expect(true).toBeFalsy(`Test should have failed`);
            })
            .finally(() => { done(); });
    });
    it("enforces game_history_id foreign key constraints", function(done) {
        createCribbageHandHistory(player.id, 0)
            .then(() => {
                // make the test fail
                expect(true).toBeFalsy(`Test should have failed`);
            })
            .finally(() => { done(); });
    });
});