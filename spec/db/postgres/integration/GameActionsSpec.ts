import * as expect from 'expect';
import { GameActions } from '../../../../db/actions/game_actions';
import Game from '../../../../db/models/Game';
import { readConfigFromEnv } from '../../setEnv';
import { fail } from './helpers';
import truncate from './truncate';

// Create an entry in the game table
export const CribbageGameName = 'cribbage';
/**
 * Create a row for the game in the database
 * @returns the Game object for that row
 */
export async function createGame(): Promise<Game> {
    return GameActions.create(CribbageGameName);
}
describe('Test the \'game\' actions', function () {
    beforeEach(async function (done) {
        readConfigFromEnv();
        done();
    });
    afterEach(async (done) => {
        // Drop the tables
        await truncate();
        done();
    });
    it('can create a new game entry', async function (done) {
        try {
            await createGame();
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find a created game by name', async function (done) {
        try {
            const game = await createGame();
            const gameReturn = await GameActions.findByName(game.name);
            expect(gameReturn.name).toBe(CribbageGameName);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
});
