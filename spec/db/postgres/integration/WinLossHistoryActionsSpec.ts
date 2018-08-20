import * as expect from 'expect';
import { WinLossHistoryActions } from '../../../../db/actions/win_loss_history_actions';
import Game from '../../../../db/models/Game';
import GameHistory from '../../../../db/models/game_history';
import Player from '../../../../db/models/player';
import WinLossHistory from '../../../../db/models/win_loss_history';
import { readConfigFromEnv } from '../../setEnv';
import { createGame } from './GameActionsSpec';
import { createGameHistory } from './GameHistoryActionsSpec';
import { fail } from './helpers';
import { createPlayer } from './PlayerActionsSpec';
import truncate from './truncate';

async function createWinLossHistory(playerId: number, gameHistoryId: number, won: boolean): Promise<WinLossHistory> {
    return WinLossHistory.create({
        playerId,
        gameHistoryId,
        won
    });
}
describe('Test the \'win-loss history\' actions', function () {
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
    it('can create a win entry', async function (done) {
        try {
            const result = await createWinLossHistory(player.id, gameHistory.id, true);
            expect(result.won).toBeTruthy('The result should have been a win');
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can create a loss entry', async function (done) {
        try {
            const result = await createWinLossHistory(player.id, gameHistory.id, false);
            expect(result.won).toBeFalsy('The result should have been a loss');
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can retrieve all win-loss history results associated with a player', async function (done) {
        try {
            const gh2 = await createGameHistory(game.id);
            const gh3 = await createGameHistory(game.id);
            await createWinLossHistory(player.id, gameHistory.id, true);
            await createWinLossHistory(player.id, gh2.id, false);
            await createWinLossHistory(player.id, gh3.id, true);
            const results = await WinLossHistoryActions.get(player.name);
            // We should have gotten back three rows
            expect(results.length).toEqual(3);
            let wins = 0, losses = 0;
            results.forEach((wlh: WinLossHistory) => {
                if (wlh.won) {
                    wins++;
                }
                else {
                    losses++;
                }
            });
            expect(wins).toEqual(2);
            expect(losses).toEqual(1);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can add multiple rows at once', async function (done) {
        try {
            const result = await createPlayer('Donatello');
            const wlhResult = await WinLossHistory.bulkCreate([
                {
                    playerId: player.id,
                    gameHistoryId: gameHistory.id,
                    won: true
                },
                {
                    playerId: result.id,
                    gameHistoryId: gameHistory.id
                }
            ]);
            expect(wlhResult.length).toEqual(2);
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
