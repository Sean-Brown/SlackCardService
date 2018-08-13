import * as expect from 'expect';
import { CribbageHand } from '../../../../card_service/implementations/cribbage_hand';
import { CribbagePlayer } from '../../../../card_service/implementations/cribbage_player';
import { CribbageHandHistoryActions } from '../../../../db/actions/cribbage_hand_history_actions';
import { GameActions } from '../../../../db/actions/game_actions';
import { GameHistoryActions } from '../../../../db/actions/game_history_actions';
import { GameHistoryPlayerActions } from '../../../../db/actions/game_history_player_actions';
import { PlayerActions } from '../../../../db/actions/player_actions';
import { CribbageHandHistory } from '../../../../db/models/cribbage_hand_history';
import { WinLossHistory } from '../../../../db/models/win_loss_history';
import { CribbageService } from '../../../../routes/Cribbage/service/cribbage_service';
import { ActiveGames } from '../../../../routes/Cribbage/service/lib/active_games';
import { ResponseCode } from '../../../../routes/response_code';
import { fail } from '../../../db/postgres/integration/helpers';
import truncate from '../../../db/postgres/integration/truncate';
import {
    aceOfClubs, eightOfClubs, fiveOfDiamonds, fiveOfHearts, fourOfClubs, fourOfSpades, jackOfDiamonds,
    jackOfHearts, jackOfSpades, kingOfClubs, nineOfClubs, queenOfClubs, sevenOfClubs, sevenOfHearts,
    sixOfClubs, sixOfDiamonds, tenOfHearts, tenOfSpades, threeOfHearts, twoOfSpades
} from '../../../StandardCards';

interface IReturn {
    status: ResponseCode;
    message: string;
}

function expectSuccess(result: IReturn) {
    expect(result.status).toEqual(ResponseCode.ok, result.message);
}

describe('The Cribbage Service', function () {
    let cribbageID;
    let PeterGriffin: CribbagePlayer, HomerSimpson: CribbagePlayer;
    const pgID: number = null, hsID: number = null;
    let gameHistories = [], winLossHistories = [];
    let cribbageService;

    /**
     Before all the tests run, make sure to create a fresh instance of the application
     in order to ensure the state of the server is reset between each test run. Also
     ensure that the database tables are created
     */
    beforeEach(async function () {
        gameHistories = [];
        winLossHistories = [];
        await truncate();
        cribbageService = new CribbageService();
        PeterGriffin = new CribbagePlayer('Peter Griffin', new CribbageHand([]));
        HomerSimpson = new CribbagePlayer('Homer Simpson', new CribbageHand([]));
    });

    /**
     * Create the player in the database
     * @param playerName
     * @returns {Promise} the ID of the player
     */
    async function createPlayer(playerName: string): Promise<number> {
        const player = await PlayerActions.create(playerName);
        return player.id;
    }

    /**
     * Create the game-history row in the database
     * @returns {Promise} the ID of the newly created row
     */
    async function createGameHistory(): Promise<number> {
        const gameHistory = await GameHistoryActions.create(cribbageID);
        return gameHistory.id;
    }

    /**
     * Create the game-history row in the database
     * @returns {Promise} the number of newly created rows
     */
    async function createGameHistoryPlayer(playerIDs: Array<number>, gameHistoryId: number): Promise<number> {
        const gameHistoryPlayer = await GameHistoryPlayerActions.createAssociations(gameHistoryId, playerIDs);
        return gameHistoryPlayer.length;
    }

    /**
     * Create the win-loss history row in the database
     * @returns {Promise} the ID of the newly created row
     */
    async function createWinLossHistory(playerId: number, gameHistoryId: number, won: boolean): Promise<number> {
        // const param = new WinLossHistory(0, playerID, gameHistoryID, won);
        const wlh = await WinLossHistory.create({
            playerId,
            gameHistoryId,
            won
        });
        return wlh.id;
    }

    /**
     * Create the Cribbage game in the database
     * @returns {Promise} the ID of the game
     */
    async function createGame(): Promise<number> {
        const game = await GameActions.create('cribbage');
        return game.id;
    }

    /**
     * Initialize the game, players, etc in the database, then initialize the cribbage service
     * @returns {Promise<Promise<string>>}
     */
    async function initialize(): Promise<string> {
        // Create the Cribbage game
        cribbageID = await createGame();
        // Create playerIDs
        const pgID = await createPlayer(PeterGriffin.name);
        const hsID = await createPlayer(HomerSimpson.name);
        const playerIDs = [pgID, hsID];
        // Create games and record some of them in the win-loss history table
        const ghid1 = await createGameHistory();
        gameHistories.push(ghid1);
        await createGameHistoryPlayer(playerIDs, ghid1);
        const ghid2 = await createGameHistory();
        gameHistories.push(ghid2);
        await createGameHistoryPlayer(playerIDs, ghid2);
        const ghid3 = await createGameHistory();
        gameHistories.push(ghid3);
        await createGameHistoryPlayer(playerIDs, ghid3);
        // Record that last one in the win-loss history table
        const wlid1 = await createWinLossHistory(pgID, gameHistories[0], true);
        winLossHistories.push(wlid1);
        const wlid2 = await createWinLossHistory(hsID, gameHistories[0], false);
        winLossHistories.push(wlid2);
        // Now initialize the Cribbage service and make sure it finds the right number of unfinished games
        return await cribbageService.init();
    }

    /**
     * Check if initialization failed, if it failed then end the test with done.fail()
     * @param error
     * @param done
     */
    function checkInitialization(error: string): void {
        if (error.length > 0) {
            fail('Failed to initialize the cribbage service');
        }
    }

    it('initializes the unfinished games correctly', async function () {
        checkInitialization(await initialize());
        expect(cribbageService.countUnfinishedGames()).toEqual(2);
    });

    describe('when initialized', function () {
        /**
         * Before each test, initialize the cribbage service
         */
        beforeEach(async function () {
            checkInitialization(await initialize());
        });

        it('doesn\'t return an error if a player tries to leave a game they\'re not in', async function () {
            const result = await cribbageService.leaveGame('Zaphod');
            expectSuccess(result);
            expect(result.message).not.toContain('Removed');
        });

        describe('joining a game', function () {
            it('doesn\'t throw an error if the same player tries to join the new game more than once', async function () {
                const result = await cribbageService.joinGame(PeterGriffin.name);
                expect(result.status).toEqual(ResponseCode.ok, result.message);
            });

            it('joins a player to a new game', async function () {
                const name = PeterGriffin.name;
                const result = await cribbageService.joinGame(name);
                expect(result.status).toEqual(ResponseCode.ok, result.message);
                expect(cribbageService.activeGames.newGame.players.findPlayer(name)).not.toBeNull(`Expected ${name} to be in the game`);
            });

            it('adds an player to the database and the service\'s map of players when the new player joins the new game', async function () {
                const name = 'Zaphod';
                const result = await cribbageService.joinGame(name);
                expect(result.status).toEqual(ResponseCode.ok, result.message);
                expect(cribbageService.activeGames.newGame.players.findPlayer(name)).not.toBeNull(`Expected ${name} to be in the game`);
                expect(cribbageService.players.has(name)).toBeTruthy();
            });

            it('joins a player to an unfinished game', async function () {
                const ugResult = await cribbageService.getUnfinishedGames(PeterGriffin.name);
                expect(ugResult.status).toEqual(ResponseCode.ok, ugResult.message);
                const jgResult = await cribbageService.joinGame(PeterGriffin.name, ugResult.gameHistoryIDs[0]);
                expectSuccess(jgResult);
            });

            it('a player joining an unfinished game with no unfinished hand in the database is dealt a hand', async function () {
                let ghid = CribbageService.INVALID_ID;
                const ugResult = await cribbageService.getUnfinishedGames(PeterGriffin.name);
                expect(ugResult.status).toEqual(ResponseCode.ok, ugResult.message);
                ghid = ugResult.gameHistoryIDs[0];
                const jgResult = await cribbageService.joinGame(PeterGriffin.name, ghid);
                expectSuccess(jgResult);
                expect(cribbageService.activeGames.activeGames.get(ghid).game.players.findPlayer(PeterGriffin.name).hand.countItems()).toBeGreaterThan(0);
            });
        });

        it('is a test', async function () {
            let ghid = CribbageService.INVALID_ID;
            const pgHand = new CribbageHand([aceOfClubs, twoOfSpades, threeOfHearts, fourOfClubs]),
                hsHand = new CribbageHand([jackOfHearts, jackOfDiamonds, queenOfClubs, kingOfClubs]),
                crib = new CribbageHand([sevenOfClubs, sevenOfHearts, eightOfClubs, nineOfClubs]),
                cut = fiveOfDiamonds;
            // In the database, fake a previous game a previous hand for each of the players
            const gameHistory = await GameHistoryActions.create(cribbageID);
            ghid = gameHistory.id;
            await GameHistoryPlayerActions.createAssociations(ghid, [pgID, hsID]);
            await CribbageHandHistory.bulkCreate([
                {
                    playerId: pgID,
                    gameHistoryId: ghid,
                    hand: pgHand.toShortString(),
                    cut: cut.shortString(),
                    isCrib: false,
                    played: true,
                    points: 10
                },
                {
                    playerId: hsID,
                    gameHistoryId: ghid,
                    hand: hsHand.toShortString(),
                    cut: cut.shortString(),
                    isCrib: false,
                    played: true,
                    points: 12
                },
                {
                    playerId: pgID,
                    gameHistoryId: ghid,
                    hand: crib.toShortString(),
                    cut: cut.shortString(),
                    isCrib: true,
                    played: true,
                    points: 12
                }
            ]);
            // reinitialize the cribbage service
            const error = await cribbageService.init();
            expect(error.length).toBe(0);
            const jgResult = await cribbageService.joinGame(PeterGriffin.name, ghid);
            expectSuccess(jgResult);
            const dbGame = cribbageService.activeGames.activeGames.get(ghid).game;
            const dbHand = dbGame.players.findPlayer(PeterGriffin.name).hand;
            expect(dbHand.countItems()).toBeGreaterThan(0);
            const dbHandStr = dbHand.toShortString();
            expect(dbHandStr).toContain(aceOfClubs.shortString());
            expect(dbHandStr).toContain(twoOfSpades.shortString());
            expect(dbHandStr).toContain(threeOfHearts.shortString());
            expect(dbHandStr).toContain(fourOfClubs.shortString());
            expect(dbGame.cut).toEqual(cut);
            expect(dbGame.dealer).toEqual(HomerSimpson);
        });

        describe('with an unfinished game in the database', function () {
            let ghid = CribbageService.INVALID_ID;
            const pgHand = new CribbageHand([aceOfClubs, twoOfSpades, threeOfHearts, fourOfClubs]),
                hsHand = new CribbageHand([jackOfHearts, jackOfDiamonds, queenOfClubs, kingOfClubs]),
                crib = new CribbageHand([sevenOfClubs, sevenOfHearts, eightOfClubs, nineOfClubs]),
                cut = fiveOfDiamonds;
            beforeEach(async function () {
                // In the database, fake a previous game a previous hand for each of the players
                const gameHistory = await GameHistoryActions.create(cribbageID);
                ghid = gameHistory.id;
                await GameHistoryPlayerActions.createAssociations(ghid, [pgID, hsID]);
                await CribbageHandHistory.bulkCreate([
                    {
                        playerId: pgID,
                        gameHistoryId: ghid,
                        hand: pgHand.toShortString(),
                        cut: cut.shortString(),
                        isCrib: false,
                        played: true,
                        points: 10
                    },
                    {
                        playerId: hsID,
                        gameHistoryId: ghid,
                        hand: hsHand.toShortString(),
                        cut: cut.shortString(),
                        isCrib: false,
                        played: true,
                        points: 12
                    },
                    {
                        playerId: pgID,
                        gameHistoryId: ghid,
                        hand: crib.toShortString(),
                        cut: cut.shortString(),
                        isCrib: true,
                        played: true,
                        points: 12
                    }
                ]);
            });

            it('a player joining an unfinished game with an unfinished hand has that hand', async function () {
                const result = await cribbageService.joinGame(PeterGriffin.name, ghid);
                expectSuccess(result);
                const dbGame = cribbageService.activeGames.activeGames.get(ghid).game;
                const dbHand = dbGame.players.find(PeterGriffin.name).hand;
                expect(dbHand.countItems()).toBeGreaterThan(0);
                const dbHandStr = dbHand.toShortString();
                expect(dbHandStr).toContain(aceOfClubs.shortString());
                expect(dbHandStr).toContain(twoOfSpades.shortString());
                expect(dbHandStr).toContain(threeOfHearts.shortString());
                expect(dbHandStr).toContain(fourOfClubs.shortString());
                expect(dbGame.cut).toEqual(cut);
            });
        });

        describe('getting unfinished games', function () {
            it('can get a player\'s unfinished games', async function () {
                const result = await cribbageService.getUnfinishedGames(PeterGriffin.name);
                expect(result.status).toEqual(ResponseCode.ok, result.message);
                expect(result.gameHistoryIDs.length).toEqual(2);
            });

            it('adds an unknown player to the database if trying to get the unfinished games of an unknown player', async function () {
                const result = await cribbageService.getUnfinishedGames('Zaphod');
                expectSuccess(result);
                expect(result.gameHistoryIDs.length).toEqual(0);
            });

            it('gets only the players from a given game', async function () {
                const player = 'Sven';
                let pid = CribbageService.INVALID_ID;
                pid = await createPlayer(player);
                expect(pid).not.toEqual(CribbageService.INVALID_ID);
                const result = await cribbageService.getUnfinishedGames(PeterGriffin.name);
                expectSuccess(result);
                const players = await cribbageService.getGamePlayers(result.gameHistoryIDs[0]);
                expect(players.length).toEqual(2);
            });

            it('returns an empty array if getting the players from a non-existant game', async function () {
                const players = await cribbageService.getGamePlayers(-1);
                expect(players.length).toEqual(0);
            });
        });

        describe('with players in the new game', function () {
            /**
             * Before each test, add players to the game
             */
            beforeEach(async function () {
                const jgResult = await cribbageService.joinGame(PeterGriffin.name);
                expect(jgResult.status).toEqual(ResponseCode.ok, jgResult.message);
                const jgResult2 = await cribbageService.joinGame(HomerSimpson.name);
                expect(jgResult2.status).toEqual(ResponseCode.ok, jgResult2.message);
                expect(cribbageService.activeGames.newGame.players.countItems()).toEqual(2);
            });

            it('only lets a player in the new game to begin the game', async function () {
                const player = 'Zaphod';
                const bgResult = await cribbageService.beginGame(player);
                expect(bgResult.status).toEqual(ResponseCode.error);
                expect(cribbageService.activeGames.newGame.hasBegun).toBeFalsy('The new game should not have begun yet');
                const bgResult2 = await cribbageService.beginGame(HomerSimpson.name);
                expectSuccess(bgResult2);
                expect(bgResult2.gameAssociation).not.toBeNull('Expected a game association object');
                expect(bgResult2.gameAssociation.playerIDs.size).toEqual(2);
                expect(cribbageService.activeGames.activeGames.has(bgResult2.gameAssociation.game_history_id)).toBeTruthy('The game should\'ve been set as an active game');
                expect(cribbageService.activeGames.playerGame.has(pgID)).toBeTruthy(`Couldn't find ${pgID} in the newly active game`);
                expect(cribbageService.activeGames.playerGame.has(hsID)).toBeTruthy(`Couldn't find ${hsID} in the newly active game`);
            });

            it('only resets the new game if the correct secret was given', function () {
                let result = cribbageService.resetGame('wrong-secret');
                expect(result.status).toEqual(ResponseCode.error);
                result = cribbageService.resetGame(process.env.CRIB_RESET_SECRET);
                expectSuccess(result);
            });

            it('lets a player leave the new game if they\'re in it', async function () {
                const result = await cribbageService.leaveGame(PeterGriffin.name);
                expect(result.message.length).toBeGreaterThan(0);
                expect(result.message).toContain('Removed');
            });
        });

        describe('with players in an active game', function () {
            let ghid = 0;
            const cut = fiveOfDiamonds;
            /**
             * Before each test, add the players to an unfinished game
             */
            beforeEach(async function () {
                ghid = gameHistories[0];
                const jgResult = await cribbageService.joinGame(PeterGriffin.name, ghid);
                expect(jgResult.status).toEqual(ResponseCode.ok, jgResult.message);
                const jgResult2 = await cribbageService.joinGame(HomerSimpson.name, ghid);
                expect(jgResult2.status).toEqual(ResponseCode.ok, jgResult2.message);
                // Replace each player's hand
                const gameAssociation = cribbageService.activeGames.activeGames.get(ghid);
                expect(gameAssociation).not.toBeNull();
                expect(gameAssociation.game.players.countItems()).toEqual(2);
                gameAssociation.game.players.findPlayer(PeterGriffin.name).hand =
                    new CribbageHand([fourOfSpades, fiveOfHearts, sixOfClubs, tenOfSpades]);
                gameAssociation.game.players.findPlayer(HomerSimpson.name).hand =
                    new CribbageHand([tenOfHearts, jackOfDiamonds, jackOfSpades, queenOfClubs]);
                gameAssociation.game.kitty =
                    new CribbageHand([sixOfDiamonds, sevenOfHearts, sevenOfClubs, eightOfClubs]);
                gameAssociation.game.cut = cut;
            });

            it('lets a player leave the active game', async function () {
                const result = await cribbageService.leaveGame(PeterGriffin.name);
                expectSuccess(result);
                expect(result.message).toContain('Removed');
            });

            describe('describes', function () {
                it('describes the current active game', function () {
                    const result = cribbageService.describe(ghid);
                    expect(result.message.length).toBeGreaterThan(0);
                    expect(result.message).not.toEqual(ActiveGames.gameNotFoundError(ghid));
                    expect(result.message).toContain(PeterGriffin.name);
                    expect(result.message).toContain(HomerSimpson.name);
                });

                it('returns an error if describing a non-existant game', function () {
                    const ghid = -1;
                    const result = cribbageService.describe(ghid);
                    expect(result.message.length).toBeGreaterThan(0);
                    expect(result.message).toEqual(ActiveGames.gameNotFoundError(ghid));
                });
            });

            describe('playing a card', function () {
                it('lets the next player play a card', async function () {
                    const result = await cribbageService.playCard(HomerSimpson.name, jackOfDiamonds);
                    expectSuccess(result);
                });

                it('returns an error if the next player plays a card they do not have', async function () {
                    const result = await cribbageService.playCard(HomerSimpson.name, fourOfSpades);
                    expect(result.status).toEqual(ResponseCode.error);
                });

                it('returns an error if a player playing a card is not the next player', async function () {
                    const result = await cribbageService.playCard(PeterGriffin.name, fourOfSpades);
                    expect(result.status).toEqual(ResponseCode.error);
                });

                it('returns an error if playing a card in a non-active game', async function () {
                    const result = await cribbageService.playCard('Zaphod', tenOfHearts);
                    expect(result.status).toEqual(ResponseCode.error);
                });

                it('doesn\'t let play continue if the game has ended', async function () {
                    cribbageService.activeGames.activeGames.get(ghid).game.players.findPlayer(PeterGriffin.name).points = 120;
                    const pc1Result = await cribbageService.playCard(HomerSimpson.name, jackOfDiamonds);
                    expectSuccess(pc1Result);
                    const pc2Result = await cribbageService.playCard(PeterGriffin.name, fiveOfHearts);
                    expectSuccess(pc2Result);
                    // The game should be over
                    expect(cribbageService.activeGames.activeGames.get(ghid)).toBeUndefined();
                    const pc3Result = await cribbageService.playCard(HomerSimpson.name, jackOfSpades);
                    expect(pc3Result.status).toEqual(ResponseCode.error);
                });
            });

            describe('when trying to \'go\'', function () {
                it('returns an error if the player can still play', async function () {
                    const result = await cribbageService.go(HomerSimpson.name);
                    expect(result.status).toEqual(ResponseCode.error);
                });

                it('lets a player who can\'t play \'go\'', async function () {
                    const pc1Result = await cribbageService.playCard(HomerSimpson.name, jackOfDiamonds);
                    expectSuccess(pc1Result);
                    const pc2Result = await cribbageService.playCard(PeterGriffin.name, tenOfSpades);
                    expectSuccess(pc2Result);
                    const pc3Result = await cribbageService.playCard(HomerSimpson.name, jackOfSpades);
                    expectSuccess(pc3Result);
                    const goResult = await cribbageService.go(PeterGriffin.name);
                    expectSuccess(goResult);
                });
            });

            describe('throwing to the kitty', function () {
                beforeEach(() => {
                    const gameAssociation = cribbageService.activeGames.activeGames.get(ghid);
                    const pg = gameAssociation.game.players.findPlayer(PeterGriffin.name);
                    pg.hand.takeCard(sixOfDiamonds);
                    pg.hand.takeCard(sevenOfHearts);
                    const hs = gameAssociation.game.players.findPlayer(HomerSimpson.name);
                    hs.hand.takeCard(sevenOfClubs);
                    hs.hand.takeCard(eightOfClubs);
                    gameAssociation.game.kitty.removeAll();
                });

                it('allows a player to throw to the kitty', async function () {
                    const result = await cribbageService.giveToKitty(PeterGriffin.name, [sixOfDiamonds, sevenOfHearts]);
                    expectSuccess(result);
                });

                it('doesn\'t let a player throw cards they don\'t have', async function () {
                    const result = await cribbageService.giveToKitty(PeterGriffin.name, [sixOfDiamonds, sevenOfClubs]);
                    expect(result.status).toEqual(ResponseCode.error);
                });

                it('doesn\'t allow a random player to throw cards', async function () {
                    const result = await cribbageService.giveToKitty('Zaphod', [sixOfDiamonds, sevenOfClubs]);
                    expect(result.status).toEqual(ResponseCode.error);
                });
            });
        });
    });
});
