import {deleteTables} from "./CreateTablesSpec";
import {readConfigFromEnv} from "./setEnv";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {Player} from "../../../../db/abstraction/tables/player";
import {DBReturnStatus, PlayerReturn} from "../../../../db/abstraction/return/db_return";
import {player_actions} from "../../../../db/implementation/postgres/player_actions";
import {verifyReturn} from "./GameActionsSpec";
var Q = require("q");

const player = "DaVinci";
/**
 * Create a row for the player in the database
 * @returns the Player object for that row
 */
export function createPlayer(): Q.Promise<Player> {
    return new Q.Promise((resolve) => {
        player_actions.create(player).then((ret: PlayerReturn) => {
            verifyReturn(ret, "Expected a result from creating a game");
            resolve(ret.first());
        });
    });
}
describe("Test the 'player' actions", function() {
    beforeEach(function(done) {
        readConfigFromEnv();
        // Create the tables
        PostgresTables.createTables().finally(() => { done(); });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can create a player", function(done) {
        createPlayer()
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find an existing player", function(done) {
        createPlayer()
            .then((result:Player) => {
                return player_actions.find(result.id);
            })
            .then((result:PlayerReturn) => {
                verifyReturn(result, "Expected a result from finding a player");
                expect(result.first().name).toBe(player);
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find an existing player by name", function(done) {
        createPlayer()
            .then((result:Player) => {
                return player_actions.findByName(result.name);
            })
            .then((result:PlayerReturn) => {
                verifyReturn(result, "Expected a result from finding a player by name");
                expect(result.first().name).toBe(player);
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    // TODO test error cases
});
