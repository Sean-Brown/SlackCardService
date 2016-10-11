import {Player} from "../../../../db/tables/player";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {Game} from "../../../../db/tables/game";
import {GameHistory} from "../../../../db/tables/game_history";
import {readConfigFromEnv} from "../../../setEnv";
import {deleteTables} from "./CreateTablesSpec";
import {createGame, verifyReturn} from "./GameActionsSpec";
import {createPlayer} from "./PlayerActionsSpec";
import {createGameHistory} from "./GameHistoryActionsSpec";
import {WinLossHistory} from "../../../../db/tables/win_loss_history";
import {win_loss_history_actions} from "../../../../db/implementation/postgres/win_loss_history_actions";
import {WinLossHistoryReturn, DBReturnStatus} from "../../../../db/db_return";
var Q = require("q");

function createWinLossHistory(player_id:number, game_history_id:number, won:boolean): Q.Promise<WinLossHistory> {
    return new Q.Promise((resolve) => {
        win_loss_history_actions.create(player_id, game_history_id, won)
            .then((ret:WinLossHistoryReturn) => {
                verifyReturn(ret, "Expected a win-loss-history result");
                resolve(ret.first());
            });
    });
}
describe("Test the 'win-loss history' actions", function() {
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
    it("can create a win entry", function(done) {
        createWinLossHistory(player.id, gameHistory.id, true)
            .then((result:WinLossHistory) => {
                expect(result.won).toBeTruthy("The result should have been a win");
            })
            .finally(() => { done(); });
    });
    it("can create a loss entry", function(done) {
        createWinLossHistory(player.id, gameHistory.id, false)
            .then((result:WinLossHistory) => {
                expect(result.won).toBeFalsy("The result should have been a loss");
            })
            .finally(() => { done(); });
    });
    it("can retrieve all win-loss history results associated with a player", function(done) {
        var gh2:GameHistory = null, gh3:GameHistory = null;
        var wl1:WinLossHistory = null, wl2:WinLossHistory = null, wl3:WinLossHistory = null;
        createGameHistory(game.id)
            .then((result:GameHistory) => {
                gh2 = result;
                return createGameHistory(game.id);
            })
            .then((result:GameHistory) => {
                gh3 = result;
                return createWinLossHistory(player.id, gameHistory.id, true);
            })
            .then((result:WinLossHistory) => {
                wl1 = result;
                return createWinLossHistory(player.id, gh2.id, false);
            })
            .then((result:WinLossHistory) => {
                wl2 = result;
                return createWinLossHistory(player.id, gh3.id, true);
            })
            .then((result:WinLossHistory) => {
                wl3 = result;
                return win_loss_history_actions.get(player.name);
            })
            .then((result:WinLossHistoryReturn) => {
                // We should have gotten back three rows
                verifyReturn(result, "Expected a win-loss-history return");
                expect(result.result.length).toEqual(3);
                var wins = 0, losses = 0;
                for (let ix = 0; ix < result.result.length; ix++) {
                    let res = result.result[ix];
                    if (res.won) { wins++; }
                    else { losses++; }
                }
                expect(wins).toEqual(2);
                expect(losses).toEqual(1);
            })
            .finally(() => { done(); });
    });
});