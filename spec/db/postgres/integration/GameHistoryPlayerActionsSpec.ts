import * as expect from 'expect';
import { GameHistoryPlayerActions } from '../../../../db/actions/game_history_player_actions';
import { Game } from '../../../../db/models/game';
import { GameHistory } from '../../../../db/models/game_history';
import { GameHistoryPlayer } from '../../../../db/models/game_history_player';
import { Player } from '../../../../db/models/player';
import { readConfigFromEnv } from '../../setEnv';
import { createGame } from './GameActionsSpec';
import { createGameHistory } from './GameHistoryActionsSpec';
import { fail } from './helpers';
import { createPlayer } from './PlayerActionsSpec';
import truncate from './truncate';

async function createGameHistoryPlayer(playerId: number, gameHistoryId: number): Promise<GameHistoryPlayer> {
    try {
        const result = await GameHistoryPlayerActions.createAssociations(gameHistoryId, [playerId]);
        return result[0];
    }
    catch (e) {
        expect(e).not.toBeNull('Should have returned a null result');
        return null;
    }
}
describe('Test the \'game-history-player\' actions', function () {
    let player: Player = null;
    let game: Game = null;
    let gameHistory: GameHistory = null;
    beforeEach(async function (done) {
        try {
            readConfigFromEnv();
            // Create the tables
            game = await createGame();
            player = await createPlayer();
            gameHistory = await createGameHistory(game.id);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error ${e}`);
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
    it('can create the game-history-player association', async function (done) {
        try {
            await createGameHistoryPlayer(player.id, gameHistory.id);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can create multiple game-history-player associations', async function (done) {
        try {
            const result = await createPlayer('Tesla');
            const ghpReturn = await GameHistoryPlayerActions.createAssociations(gameHistory.id, [
                player.id, result.id
            ]);
            expect(ghpReturn.length).toEqual(2);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find the game-history-player assocation', async function (done) {
        try {
            await createGameHistoryPlayer(player.id, gameHistory.id);
            const result = await GameHistoryPlayerActions.findAssociation(player.id, gameHistory.id);
            expect(result).not.toBeNull();
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
