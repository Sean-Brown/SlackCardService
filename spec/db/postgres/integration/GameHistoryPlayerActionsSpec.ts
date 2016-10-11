import {deleteTables} from "./CreateTablesSpec";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {Game} from "../../../../db/tables/game";
import {createGame, verifyReturn} from "./GameActionsSpec";
import {readConfigFromEnv} from "../../../setEnv";
import {GameHistory} from "../../../../db/tables/game_history";
import {createGameHistory} from "./GameHistoryActionsSpec";
import {Player} from "../../../../db/tables/player";
import {createPlayer} from "./PlayerActionsSpec";
import {GameHistoryPlayerPivot} from "../../../../db/tables/game_history_player";
import {game_history_player_actions} from "../../../../db/implementation/postgres/game_history_player_actions";
import {GameHistoryPlayerReturn, DBReturnStatus} from "../../../../db/db_return";
var Q = require("q");

function createGameHistoryPlayer(player_id:number, game_history_id:number): Q.Promise<GameHistoryPlayerPivot> {
    return new Q.Promise((resolve) => {
        game_history_player_actions.createAssociation(player_id, game_history_id).then((ret: GameHistoryPlayerReturn) => {
            verifyReturn(ret, "Expected a game-history-player return value");
            resolve(ret.first());
        });
    });
}
describe("Test the 'game-history-player' actions", function() {
    var player:Player = null;
    var game:Game = null;
    var gameHistory:GameHistory = null;
    beforeEach(function(done) {
        readConfigFromEnv();
        // Asynchronously drop the schema
        deleteTables().then(() => {
            // Re-create the tables to start from a fresh slate
            PostgresTables.createModels()
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
    it("can create the game-history-player association", function(done) {
        createGameHistoryPlayer(player.id, gameHistory.id).finally(() => { done(); });
    });
});