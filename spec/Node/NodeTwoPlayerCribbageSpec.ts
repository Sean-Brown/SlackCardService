import * as async from 'async';
import * as expect from 'expect';
import { Application } from 'express';
import { request } from 'supertest';
import { CribbageRoutePrefix } from '../../app';
import { Teams } from '../../card_service/base_classes/card_game';
import { ItemCollection } from '../../card_service/base_classes/collections/item_collection';
import { BaseCard } from '../../card_service/base_classes/items/card';
import { Cribbage, CribbageGameDescription, CribbageStrings } from '../../card_service/implementations/cribbage';
import { CribbageHand } from '../../card_service/implementations/cribbage_hand';
import { CribbagePlayer } from '../../card_service/implementations/cribbage_player';
import { CribbageTeam } from '../../card_service/implementations/cribbage_team';
import { CribbageHandHistoryActions } from '../../db/actions/cribbage_hand_history_actions';
import { GameActions } from '../../db/actions/game_actions';
import { GameHistoryActions } from '../../db/actions/game_history_actions';
import { GameHistoryPlayerActions } from '../../db/actions/game_history_player_actions';
import { PlayerActions } from '../../db/actions/player_actions';
import { WinLossHistoryActions } from '../../db/actions/win_loss_history_actions';
import { Games } from '../../db/games';
import { CribbageRoutes } from '../../routes/Cribbage';
import truncate from '../db/postgres/integration/truncate';
import {
    eightOfClubs, fiveOfDiamonds, fourOfSpades, jackOfClubs, nineOfSpades, sevenOfClubs,
    sevenOfDiamonds, sevenOfHearts, sixOfClubs, sixOfDiamonds, sixOfSpades, tenOfHearts, tenOfSpades
} from '../StandardCards';
import { createNewServer } from './setup';
import CribbageResponseData = CribbageRoutes.CribbageResponseData;
import Tokens = CribbageRoutes.Tokens;
import Router = CribbageRoutes.Router;

const spyOn = expect.spyOn;

describe('Integration test the Cribbage game between two playerIDs', function () {
    this.timeout(0);
    const app: Application = null;
    let PeterGriffin: CribbagePlayer, pgID: number, HomerSimpson: CribbagePlayer, hsID: number,
        cribbageID: number, currentGameID: number;
    let pgHand, hsHand, crib;
    const cut = sevenOfDiamonds;
    let cribRoutes: Router;

    /**
     * Due to the nature of slash commands, a response must be received within 3 seconds but
     * additional responses may be sent to the channel. Due to this, the routes for the card service
     * immediately acknowledge the request, then (usually) perform some async task, then make a
     * delayed response to the channel. This immediate response screws up these tests, which get
     * the response and immediately go to the next function, even though the action hasn't been
     * completed. A more complex client would wait for 'x' responses before continuing, but that's
     * complex so for now just delay the time between methods.
     * @param cb
     */
    function delayFunc(cb: Function) {
        // Delay between tests because the service returns multiple responses, causing other functions to begin too soon
        const testDelay = 2000;
        setTimeout(() => {
            cb();
        }, testDelay);
    }

    /*
     Before all the tests run, make sure to create a fresh instance of the application
     in order to ensure the state of the server is reset between each test run. Also
     ensure that the database tables are created
     */
    beforeEach(async function () {
        await truncate();
        await createNewServer(app);
        // Set the current game that's in the routes object (from app.ts)
        cribRoutes = app.locals.cribbageRoutes;
        spyOn(Router.IMAGE_MANAGER, 'createDiscardImageAsync').andCall(async () => {
            return '';
        });
        spyOn(Router.IMAGE_MANAGER, 'createSequenceImageAsync').andCall(async () => {
            return '';
        });
        spyOn(Router.IMAGE_MANAGER, 'createPlayerHandImageAsync').andCall(async () => {
            return '';
        });
        // Initialize the hands
        pgHand = new CribbageHand([fourOfSpades, fiveOfDiamonds, sixOfClubs, sixOfSpades, tenOfSpades, jackOfClubs]);
        hsHand = new CribbageHand([sixOfDiamonds, sevenOfClubs, sevenOfHearts, eightOfClubs, nineOfSpades, tenOfHearts]);
        crib = new CribbageHand([]);
        PeterGriffin = new CribbagePlayer('Peter Griffin', new CribbageHand([]));
        HomerSimpson = new CribbagePlayer('Homer Simpson', new CribbageHand([]));
    });
    // After all the tests have run, drop the tables
    afterEach(async function () {
        // Asynchronously drop the schema
        await truncate();
    });

    function getJson(token: string, userName = '', text = '') {
        return {
            token: token,
            user_name: userName,
            text: text
        };
    }

    function joinGameJson(player: CribbagePlayer, token: string) {
        return getJson(token, player.name);
    }

    function addPlayersAndTeams() {
        const currentGame = cribRoutes.cribbageService.activeGames.newGame;
        currentGame.players.removeAll();
        currentGame.players.addPlayer(PeterGriffin);
        currentGame.players.addPlayer(HomerSimpson);
        currentGame.playersInPlay = new ItemCollection([PeterGriffin, HomerSimpson]);
        currentGame.numPlayers = 2;
        currentGame.teams = new Teams(new ItemCollection<CribbageTeam>([
            new CribbageTeam(1, [PeterGriffin]),
            new CribbageTeam(2, [HomerSimpson])
        ]));
    }

    function makeRoute(route: string): string {
        return `${CribbageRoutePrefix}${route}`;
    }

    function playCard(agent: any, player: CribbagePlayer, card: BaseCard, cb: Function) {
        agent.post(makeRoute(CribbageRoutes.Routes.playCard))
            .type('json')
            .send(getJson(Tokens.playCard, player.name, card.shortString()))
            .expect(200, cb);
    }

    function go(agent: any, player: CribbagePlayer, cb: Function) {
        agent.post(makeRoute(CribbageRoutes.Routes.go))
            .type('json')
            .send(getJson(Tokens.go, player.name))
            .expect(200, cb);
    }

    async function findPlayerInDatabase(player: CribbagePlayer): Promise<number> {
        // Expect the player to be in the 'player' database table
        let playerID;
        const result = await PlayerActions.findByName(player.name);
        playerID = result.id;
        await findGameHistoryPlayer(playerID);
        return playerID;
    }

    async function findGameInDatabase(): Promise<void> {
        const result = await GameActions.findByName(Games.Cribbage);
        cribbageID = result.id;
        // Find the game history
        const ghReturn = await GameHistoryActions.findMostRecent(cribbageID);
        currentGameID = ghReturn.id;
    }

    async function findGameHistoryPlayer(playerID: number): Promise<void> {
        const ghp = await GameHistoryPlayerActions.findAssociation(playerID, currentGameID);
        expect(ghp).not.toBeNull();
    }

    async function findCribbageHandHistory(playerID: number, expectedHand: CribbageHand, kitty: boolean): Promise<void> {
        const hands = await CribbageHandHistoryActions.all(currentGameID, playerID);
        expect(hands.length).toBeGreaterThan(0);
        let chh;
        for (const hand of hands) {
            if (kitty === hand.isCrib) {
                // Either this is the kitty or it's not, either way there's a match
                chh = hand;
                break;
            }
        }
        const hand = Router.parseCards(chh.hand);
        for (let ix = 0; ix < expectedHand.size(); ix++) {
            let found = false;
            const cardX = expectedHand.itemAt(ix);
            for (let iy = 0; iy < hand.length; iy++) {
                const cardY = hand[iy];
                if (cardX.equalsOther(cardY)) {
                    found = true;
                    break;
                }
            }
            expect(found).toBeTruthy(`Couldn't find ${cardX.toString()}`);
        }
        expect(cut).toEqual(chh.cut);
    }

    async function findWinLossInDatabase(playerName: string, won: boolean): Promise<void> {
        const result = await WinLossHistoryActions.get(playerName);
        expect(result[0].won).toEqual(won);
    }

    function getCurrentGame(): Cribbage {
        const ga = cribRoutes.cribbageService.activeGames.activeGames.get(currentGameID);
        if (ga) {
            return ga.game;
        }
        else {
            return null;
        }
    }

    function joinGameAndBeginSeries(agent) {
        return [
            function (cb) {
                // Peter Griffin joins the game
                agent.post(makeRoute(CribbageRoutes.Routes.joinGame))
                    .type('json')
                    .send(joinGameJson(PeterGriffin, Tokens.joinGame))
                    .expect(200)
                    .end(cb);
            },
            function (cb) {
                delayFunc(() => {
                    // Homer Simpson joins the game
                    agent.post(makeRoute(CribbageRoutes.Routes.joinGame))
                        .type('json')
                        .send(joinGameJson(HomerSimpson, Tokens.joinGame))
                        .expect(200)
                        .end(cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // Intercept the dealing and assign our own hands
                    const newGame = cribRoutes.cribbageService.activeGames.newGame;
                    spyOn(newGame, 'begin').andCall(() => {
                        // Initialize the playerIDs and teams
                        addPlayersAndTeams();
                        // Assign the dealer
                        newGame.dealer = PeterGriffin;
                        newGame.nextPlayerInSequence = HomerSimpson;
                        // Assign the hands
                        PeterGriffin.hand = pgHand;
                        HomerSimpson.hand = hsHand;
                    });
                    // Begin the game
                    agent.post(makeRoute(CribbageRoutes.Routes.beginGame))
                        .send(getJson(Tokens.beginGame, PeterGriffin.name))
                        .expect(200)
                        .expect((res) => {
                            const response = <CribbageResponseData>JSON.parse(res.text);
                            if (response.text.indexOf(CribbageStrings.MessageStrings.FMT_START_GAME) === -1) {
                                return true; // Return true to indicate an error, see the SuperTest documentation
                            }
                        })
                        .end(cb);
                });
            },
            function (cb) {
                delayFunc(async () => {
                    // Find the game, game_history, and player in the database
                    await findGameInDatabase();
                    pgID = await findPlayerInDatabase(PeterGriffin);
                    hsID = await findPlayerInDatabase(HomerSimpson);
                    cb();
                });
            }
        ];
    }

    function throwCardsSeries(agent) {
        return [
            function (cb) {
                delayFunc(() => {
                    // throw cards
                    agent.post(makeRoute(CribbageRoutes.Routes.throwCard))
                        .type('json')
                        .send(getJson(Tokens.throwCard, PeterGriffin.name, `${tenOfSpades.shortString()} ${jackOfClubs.shortString()}`))
                        .expect(200, () => {
                            crib.addItems([tenOfSpades, jackOfClubs]);
                            cb();
                        });
                });
            },
            function (cb) {
                delayFunc(() => {
                    const currentGame = getCurrentGame();
                    spyOn(currentGame, 'cutTheDeck').andCall(() => {
                        // Set the cut card
                        currentGame.cut = cut;
                    });
                    // throw cards
                    agent.post(makeRoute(CribbageRoutes.Routes.throwCard))
                        .type('json')
                        .send(getJson(Tokens.throwCard, HomerSimpson.name, `${nineOfSpades.shortString()} ${tenOfHearts.shortString()}`))
                        .expect(200, () => {
                            crib.addItems([nineOfSpades, tenOfHearts]);
                            cb();
                        });
                });
            }
        ];
    }

    function playCardsSeries(agent) {
        return [
            // Play cards
            function (cb) {
                delayFunc(() => {
                    // 7
                    playCard(agent, HomerSimpson, sevenOfClubs, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 11
                    playCard(agent, PeterGriffin, fourOfSpades, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 18
                    playCard(agent, HomerSimpson, sevenOfHearts, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 24
                    playCard(agent, PeterGriffin, sixOfClubs, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 30 for 2
                    playCard(agent, HomerSimpson, sixOfDiamonds, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // go
                    go(agent, PeterGriffin, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // go
                    go(agent, HomerSimpson, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 6
                    playCard(agent, PeterGriffin, sixOfSpades, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 14
                    playCard(agent, HomerSimpson, eightOfClubs, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // 19
                    playCard(agent, PeterGriffin, fiveOfDiamonds, cb);
                });
            }
        ];
    }

    it('lets any player reset the new game', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent).concat(
            function (cb) {
                delayFunc(() => {
                    // Reset the game
                    agent.post(makeRoute(CribbageRoutes.Routes.resetGame))
                        .send(getJson(Tokens.resetGame))
                        .expect(200)
                        .expect(function (res) {
                            expect(res.text).toContain('game was reset');
                        })
                        .end(cb);
                });
            });
        async.series(series, done);
    });

    it('lets players join the game and begin', function (done) {
        const agent = request(this.app);
        async.series(joinGameAndBeginSeries(agent), done);
    });

    it('describes the current game', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent).concat(
            function (cb) {
                delayFunc(() => {
                    // Get the description
                    agent.post(makeRoute(CribbageRoutes.Routes.describe))
                        .send(getJson(Tokens.describe, PeterGriffin.name, `${currentGameID}`))
                        .expect(200)
                        .expect(function (res) {
                            const response = <CribbageResponseData>JSON.parse(res.text);
                            const description: CribbageGameDescription = JSON.parse(response.text);
                            const hasDealer = (description.dealer === PeterGriffin.name || description.dealer === HomerSimpson.name);
                            expect(hasDealer).toBe(true);
                        })
                        .end(cb);
                });
            });
        async.series(series, done);
    });

    // Disable the test by default since I don't want the test to download card images
    // it('is able to show a player\'s cards', function(done) {
    //     let agent = request(this.app);
    //     let series = joinGameAndBeginSeries(agent).concat(
    //         function (cb) {
    //             // Show player one's hand
    //             agent.post(makeRoute(CribbageRoutes.Routes.showHand))
    //                 .send(getJson(Tokens.showHand, PeterGriffin.name))
    //                 .expect(200)
    //                 .end(cb);
    //         });
    //     async.series(series, done);
    // });

    it('is able to play and store a round of play', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent)
            .concat(throwCardsSeries(agent))
            .concat(playCardsSeries(agent))
            .concat([
                // Check the database for the correct hand history
                function (cb) {
                    delayFunc(() => {
                        findCribbageHandHistory(pgID, pgHand, false)
                            .then(() => cb());
                    });
                },
                function (cb) {
                    delayFunc(() => {
                        findCribbageHandHistory(hsID, hsHand, false)
                            .then(() => cb());
                    });
                },
                function (cb) {
                    delayFunc(() => {
                        findCribbageHandHistory(pgID, crib, true)
                            .then(() => cb());
                    });
                }
            ]);
        async.series(series, done);
    });

    it('is able to record a win', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent)
            .concat(throwCardsSeries(agent))
            .concat([
                function (cb) {
                    delayFunc(() => {
                        // Make one of the playerIDs have enough points to win
                        getCurrentGame().players.findPlayer(PeterGriffin.name).points = 120;
                        playCard(agent, HomerSimpson, sixOfDiamonds, cb);
                    });
                },
                function (cb) {
                    delayFunc(() => {
                        // Should be game over
                        playCard(agent, PeterGriffin, sixOfClubs, cb);
                    });
                }
            ])
            .concat([
                // Check the database for the correct hand history
                function (cb) {
                    delayFunc(() => {
                        findCribbageHandHistory(pgID, pgHand, false)
                            .then(() => cb());
                    });
                },
                function (cb) {
                    delayFunc(() => {
                        findCribbageHandHistory(hsID, hsHand, false)
                            .then(() => cb());
                    });
                },
                function (cb) {
                    delayFunc(() => {
                        findCribbageHandHistory(pgID, crib, true)
                            .then(() => cb());
                    });
                },
                // Check that it recorded the win/loss
                function (cb) {
                    delayFunc(() => {
                        findWinLossInDatabase(PeterGriffin.name, true)
                            .then(() => cb());
                    });
                },
                function (cb) {
                    delayFunc(() => {
                        findWinLossInDatabase(HomerSimpson.name, false)
                            .then(() => cb());
                    });
                }
            ]);
        async.series(series, done);
    });

    it('lets a player leave the new game', function (done) {
        const agent = request(this.app);
        const series = [
            function (cb) {
                delayFunc(() => {
                    // Peter Griffin joins the game
                    agent.post(makeRoute(CribbageRoutes.Routes.joinGame))
                        .type('json')
                        .send(joinGameJson(PeterGriffin, Tokens.joinGame))
                        .expect(200, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // Leave the game
                    agent.post(makeRoute(CribbageRoutes.Routes.leaveGame))
                        .send(getJson(Tokens.leaveGame, PeterGriffin.name))
                        .expect(200, cb);
                });
            }
        ];
        async.series(series, done);
    });

    it('lets a player leave from a game that has begun', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent).concat(
            function (cb) {
                delayFunc(() => {
                    // Leave the game
                    agent.post(makeRoute(CribbageRoutes.Routes.leaveGame))
                        .send(getJson(Tokens.leaveGame, PeterGriffin.name))
                        .expect(200, cb);
                });
            });
        async.series(series, done);
    });

    it('gets the players unfinished game', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent).concat(
            function (cb) {
                delayFunc(() => {
                    // get the unfinished games
                    agent.post(makeRoute(CribbageRoutes.Routes.unfinishedGames))
                        .send(getJson(Tokens.unfinishedGames, PeterGriffin.name))
                        .expect(200, cb);
                });
            });
        async.series(series, done);
    });

    it('gets the players unfinished games', function (done) {
        const agent = request(this.app);
        let series = joinGameAndBeginSeries(agent).concat(
            function (cb) {
                delayFunc(() => {
                    // leave the game
                    agent.post(makeRoute(CribbageRoutes.Routes.leaveGame))
                        .send(getJson(Tokens.unfinishedGames, PeterGriffin.name))
                        .expect(200, cb);
                });
            },
            function (cb) {
                delayFunc(() => {
                    // leave the game
                    agent.post(makeRoute(CribbageRoutes.Routes.leaveGame))
                        .send(getJson(Tokens.unfinishedGames, HomerSimpson.name))
                        .expect(200, cb);
                });
            });
        series = series.concat(joinGameAndBeginSeries(agent));
        series = series.concat(
            function (cb) {
                delayFunc(() => {
                    // get the unfinished games
                    agent.post(makeRoute(CribbageRoutes.Routes.unfinishedGames))
                        .send(getJson(Tokens.unfinishedGames, PeterGriffin.name))
                        .expect(200, cb);
                });
            });
        async.series(series, done);
    });

    it('gets the players current game', function (done) {
        const agent = request(this.app);
        const series = joinGameAndBeginSeries(agent).concat(
            function (cb) {
                delayFunc(() => {
                    // get the current game
                    agent.post(makeRoute(CribbageRoutes.Routes.currentGame))
                        .send(getJson(Tokens.currentGame, PeterGriffin.name))
                        .expect(200, cb);
                });
            });
        async.series(series, done);
    });
});
