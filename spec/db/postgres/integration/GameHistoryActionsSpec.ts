import * as expect from 'expect';
import { GameHistoryActions } from '../../../../db/actions/game_history_actions';
import { GameHistoryPlayerActions } from '../../../../db/actions/game_history_player_actions';
import Game from '../../../../db/models/Game';
import GameHistory from '../../../../db/models/game_history';
import { readConfigFromEnv } from '../../setEnv';
import { createGame } from './GameActionsSpec';
import { fail } from './helpers';
import { createPlayer } from './PlayerActionsSpec';
import truncate from './truncate';

/**
 * Create a row for the game-history in the database
 * @param {number} gameID the ID of the game
 * @param {boolean} expectResult (=true) expect a non-null return object
 * @returns the game-history object for that row
 */
export async function createGameHistory(gameID: number, expectResult = true): Promise<GameHistory> {
    try {
        const gameHistory = await GameHistoryActions.create(gameID);
        return gameHistory;
    }
    catch (e) {
        if (expectResult) {
            fail(`failed to create the game history record`);
        }
        return null;
    }
}
describe('Test the \'game-history\' actions', function () {
    let game: Game = null;
    beforeEach(async function (done) {
        try {
            readConfigFromEnv();
            // Before beginning, create a game and save it
            game = await createGame();
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    afterEach(async (done) => {
        // Drop the tables
        await truncate();
        done();
    });
    it('can create a game-history entry', async function (done) {
        try {
            await createGameHistory(game.id);
        }
        catch (e) {
            fail(`Test should have succeeded. Error ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find the most recent game-history entry', async function (done) {
        const gameHistory = await createGameHistory(game.id);
        const result = await GameHistoryActions.findMostRecent(game.id);
        expect(result.id).toEqual(gameHistory.id);
        done();
    });
    it('can find the most recent game-history entry', async function (done) {
        const gh1 = await createGameHistory(game.id);
        const gh2 = await createGameHistory(game.id);
        expect(gh1.id).toBeLessThan(gh2.id);
        expect(gh1.began.valueOf()).toBeLessThan(gh2.began.valueOf());
        const result = await GameHistoryActions.findMostRecent(game.id);
        expect(result.id).toEqual(gh2.id);
        done();
    });
    it('can find the most recent game-history entry that has not yet ended', async function (done) {
        const gh1 = await createGameHistory(game.id);
        const gh2 = await createGameHistory(game.id);
        expect(gh1.id).toBeLessThan(gh2.id);
        expect(gh1.began.valueOf()).toBeLessThan(gh2.began.valueOf());
        // End game 2
        const result = await GameHistoryActions.endGame(gh2.id);
        expect(result).toBeTruthy();
        // Finding the most recent game history should now return game-history 1
        const ghReturn = await GameHistoryActions.findMostRecent(game.id);
        expect(ghReturn.id).toEqual(gh1.id, 'The most recent game-history result should have been the first game since that one has not yet ended');
        done();
    });
    it('can end a game', async function (done) {
        const gh = await createGameHistory(game.id);
        const result = await GameHistoryActions.endGame(gh.id);
        const first = result['1'][0];
        expect(first.id).toEqual(gh.id);
        expect(first.ended).toBeTruthy('Expected an \'ended\' timestamp');
        expect(first.began.valueOf()).toBeLessThan(first.ended.valueOf(), 'Expected the game to end AFTER it began');
        done();
    });
    it('can find the game history records associated with a player for a specific game', async function (done) {
        const gh = await createGameHistory(game.id);
        const player = await createPlayer();
        await GameHistoryPlayerActions.createAssociations(gh.id, [player.id]);
        const ghReturn = await GameHistoryActions.find(gh.id, player.name);
        expect(ghReturn[0].id).toEqual(gh.id);
        done();
    });
    it('enforces gameID foreign key constraint', async function (done) {
        const result = await createGameHistory(0, false);
        if (result !== null) {
            fail(`Test should have failed`);
        }
        done();
    });
});
