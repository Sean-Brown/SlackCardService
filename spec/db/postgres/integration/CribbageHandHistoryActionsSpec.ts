import * as expect from 'expect';
import { CribbageHandHistoryActions } from '../../../../db/actions/cribbage_hand_history_actions';
import { CribbageHandHistory } from '../../../../db/models/cribbage_hand_history';
import { Game } from '../../../../db/models/game';
import { GameHistory } from '../../../../db/models/game_history';
import { Player } from '../../../../db/models/player';
import { ResponseCode } from '../../../../routes/response_code';
import { readConfigFromEnv } from '../../setEnv';
import { createGame } from './GameActionsSpec';
import { createGameHistory } from './GameHistoryActionsSpec';
import { fail } from './helpers';
import { createPlayer } from './PlayerActionsSpec';
import truncate from './truncate';

const hand = '4s-4c-5d-6s';
const cut = '6h';
async function createCribbageHandHistory(gameHistoryId: number, playerId: number, isCrib = false, expectResult = true): Promise<CribbageHandHistory> {
    return CribbageHandHistory.create({
        playerId,
        gameHistoryId,
        hand,
        cut,
        isCrib
    });
}
let player = null;
let game = null;
let gameHistory = null;
describe('Test the \'cribbage-hand-history\' actions', function () {
    beforeEach(async function (done) {
        readConfigFromEnv();
        // Create the tables
        game = await createGame();
        player = await createPlayer();
        gameHistory = await createGameHistory(game.id);
        done();
    });
    afterEach(async (done) => {
        // Drop the tables
        await truncate();
        done();
    });
    it('can add a cribbage-hand-history row', async function (done) {
        try {
            await createCribbageHandHistory(gameHistory.id, player.id);
        }
        catch (e) {
            // make the test fail
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('enforces player_id foreign key constraints', async function (done) {
        try {
            await createCribbageHandHistory(gameHistory.id, 0, false, false);
        }
        finally {
            done();
        }
    });
    it('enforces game_history_id foreign key constraints', async function (done) {
        try {
            await createCribbageHandHistory(0, player.id, false, false);
        }
        catch (e) {
            // expected
        }
        finally {
            done();
        }
    });
    it('differentiates between a \'normal\' hand and a \'crib\' hand', async function (done) {
        try {
            await createCribbageHandHistory(gameHistory.id, player.id, false);
            await createCribbageHandHistory(gameHistory.id, player.id, true);
            const chhs = await CribbageHandHistoryActions.all(player.id, gameHistory.id);
            expect(chhs.length).toEqual(2);
            let normal = 0, crib = 0;
            chhs.forEach((chh: CribbageHandHistory) => {
                if (chh.isCrib) {
                    crib++;
                }
                else {
                    normal++;
                }
            });
            expect(normal).toEqual(1);
            expect(crib).toEqual(1);
        }
        catch (e) {
            fail(`The test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can add multiple cribbage hand history rows at once', async function (done) {
        await CribbageHandHistory.bulkCreate([
            {
                playerId: player.id,
                gameHistoryId: gameHistory.id,
                hand: 'ac 2d 3s 4c',
                cut: '5h'
            },
            {
                playerId: player.id,
                gameHistoryId: gameHistory.id,
                hand: 'ad 2c 3d 4s',
                cut: '5c'
            },
            {
                playerId: player.id,
                gameHistoryId: gameHistory.id,
                hand: 'ah 2s 3h 4d',
                cut: '5s',
                isCrib: true
            },
        ]);
        const chhResult = await CribbageHandHistoryActions.all(gameHistory.id, player.id);
        expect(chhResult.length).toEqual(3);
        done();
    });
});
