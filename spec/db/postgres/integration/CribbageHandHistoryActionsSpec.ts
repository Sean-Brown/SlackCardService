import {deleteTables} from "./CreateTablesSpec";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {Player} from "../../../../db/tables/player";
import {GameHistory} from "../../../../db/tables/game_history";
import {Game} from "../../../../db/tables/game";
import {readConfigFromEnv} from "../../../setEnv";
import {createGame, verifyReturn} from "./GameActionsSpec";
import {createPlayer} from "./PlayerActionsSpec";
import {createGameHistory} from "./GameHistoryActionsSpec";
import {HandHistory} from "../../../../db/tables/hand_history";
import {cribbage_hand_history_actions} from "../../../../db/implementation/postgres/cribbage_hand_history_actions";
import {CribbageHandHistoryReturn} from "../../../../db/db_return";
var Q = require("q");

const hand = "4s-4c-5d-6s";
const cut = "6h";
function createHandHistory(player_id:number, game_history_id:number): Q.Promise<HandHistory> {
    return new Q.Promise((resolve) => {
        cribbage_hand_history_actions.create(player_id, game_history_id, hand, cut).then((ret: CribbageHandHistoryReturn) => {
            verifyReturn(ret, "Expected a hand-history result");
            resolve(ret.first());
        })
    });
}
describe("Test the 'hand-history' actions", function() {
    var player:Player = null;
    var game:Game = null;
    var gameHistory:GameHistory = null;
    beforeEach(function(done) {
        readConfigFromEnv();
        // Asynchronously drop the schema
        deleteTables().then(() => {
            // Re-create the tables to start from a fresh slate
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
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can add a hand-history row", function(done) {
        createHandHistory(player.id, gameHistory.id).finally(() => { done(); });
    });
});