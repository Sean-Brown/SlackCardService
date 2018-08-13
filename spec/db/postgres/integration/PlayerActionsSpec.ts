import * as expect from 'expect';
import { PlayerActions } from '../../../../db/actions/player_actions';
import { Player } from '../../../../db/models/player';
import { readConfigFromEnv } from '../../setEnv';
import { fail } from './helpers';
import truncate from './truncate';

const PlayerName = 'DaVinci';
/**
 * Create a row for the player in the database
 * @param playerName the name of the player, defaults to {player}
 * @returns the Player object for that row
 */
export async function createPlayer(playerName: string = PlayerName): Promise<Player> {
    return PlayerActions.create(playerName);
}
describe('Test the \'player\' actions', function () {
    beforeEach(function () {
        readConfigFromEnv();
    });
    afterEach(async (done) => {
        // Drop the tables
        await truncate();
        done();
    });
    it('can create a player', async function (done) {
        try {
            await createPlayer();
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded: Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find an existing player', async function (done) {
        try {
            const player = await createPlayer();
            const result = await PlayerActions.findById(player.id);
            expect(result.name).toBe(PlayerName);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded: Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find an existing player by name', async function (done) {
        try {
            const player = await createPlayer();
            const result = await PlayerActions.findByName(player.name);
            expect(result.name).toBe(PlayerName);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded: Error: ${e}`);
        }
        finally {
            done();
        }
    });
});
