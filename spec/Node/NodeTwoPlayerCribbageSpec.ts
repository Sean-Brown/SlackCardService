/// <reference path="../../typings/index.d.ts" />
/// <reference path="../../card_service/base_classes/collections/hand.ts" />
/// <reference path="../../card_service/implementations/cribbage_player.ts" />
/// <reference path="../../card_service/implementations/cribbage_team.ts" />
/// <reference path="../../card_service/implementations/cribbage.ts" />
/// <reference path="../../card_service/base_classes/card_game.ts" />

import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {CribbageGameDescription, CribbageStrings, Cribbage} from "../../card_service/implementations/cribbage";
import {CribbageHand} from "../../card_service/implementations/cribbage_hand";
import {CribbageRoutePrefix} from "../../app";
import {createNewServer} from "./setup";
import {CribbageRoutes} from "../../routes/Cribbage/index";
import Response = Express.Response;
import CribbageResponseData = CribbageRoutes.CribbageResponseData;

"use strict";
import {deleteTables} from "../db/postgres/integration/CreateTablesSpec";
import {player_actions} from "../../db/implementation/postgres/player_actions";
import {
    PlayerReturn, DBReturnStatus, GameReturn, DBReturn,
    GameHistoryReturn, GameHistoryPlayerReturn, CribbageHandHistoryReturn, WinLossHistoryReturn
} from "../../db/abstraction/return/db_return";
import {game_actions} from "../../db/implementation/postgres/game_actions";
import {Games} from "../../db/implementation/games";
import {game_history_actions} from "../../db/implementation/postgres/game_history_actions";
import {game_history_player_actions} from "../../db/implementation/postgres/game_history_player_actions";
import {
    fiveOfDiamonds, fourOfSpades, sixOfSpades, sixOfClubs, jackOfClubs, tenOfSpades,
    tenOfHearts, nineOfSpades, eightOfClubs, sevenOfHearts, sevenOfClubs, sixOfDiamonds, sevenOfDiamonds
} from "../StandardCards";
import Tokens = CribbageRoutes.Tokens;
import {BaseCard} from "../../card_service/base_classes/items/card";
import {cribbage_hand_history_actions} from "../../db/implementation/postgres/cribbage_hand_history_actions";
import {verifyReturn} from "../verifyReturn";
import Router = CribbageRoutes.Router;
import {CribbageTeam} from "../../card_service/implementations/cribbage_team";
import {ItemCollection} from "../../card_service/base_classes/collections/item_collection";
import {Teams} from "../../card_service/base_classes/card_game";
import {win_loss_history_actions} from "../../db/implementation/postgres/win_loss_history_actions";

var request = require("supertest"),
    async   = require("async"),
    expect  = require("expect"),
    spyOn   = expect.spyOn,
    Q       = require("q");

describe("Integration test the Cribbage game between two players", function() {
    var PeterGriffin:CribbagePlayer, pgID:number, HomerSimpson:CribbagePlayer, hsID:number,
        cribbageID:number, currentGameID:number;
    var pgHand, hsHand, crib;
    var cut = sevenOfDiamonds;
    var cribRoutes;

    /*
       Before all the tests run, make sure to create a fresh instance of the application
       in order to ensure the state of the server is reset between each test run. Also
       ensure that the database tables are created
     */
    beforeEach(function(done) {
        var that = this;
        deleteTables()
            .then(() => {
                return createNewServer(that);
            })
            .then(() => {
                // Set the current game that's in the routes object (from app.ts)
                cribRoutes = that.app.locals.cribbageRoutes;
                spyOn(Router.IMAGE_MANAGER, "createDiscardImageAsync").andCall(() => {
                    return new Q.Promise((resolve) => { resolve(""); });
                });
                spyOn(Router.IMAGE_MANAGER, "createSequenceImageAsync").andCall(() => {
                    return new Q.Promise((resolve) => { resolve(""); });
                });
                spyOn(Router.IMAGE_MANAGER, "createPlayerHandImageAsync").andCall(() => {
                    return new Q.Promise((resolve) => { resolve(""); });
                });
                // Initialize the hands
                pgHand = new CribbageHand([fourOfSpades, fiveOfDiamonds, sixOfClubs, sixOfSpades, tenOfSpades, jackOfClubs]);
                hsHand = new CribbageHand([sixOfDiamonds, sevenOfClubs, sevenOfHearts, eightOfClubs, nineOfSpades, tenOfHearts]);
                crib = new CribbageHand([]);
            })
            .finally(() => {
                PeterGriffin = new CribbagePlayer("Peter Griffin", new CribbageHand([]));
                HomerSimpson = new CribbagePlayer("Homer Simpson", new CribbageHand([]));
                done();
            })
    });
    // After all the tests have run, drop the tables
    afterEach(function(done) {
        // Asynchronously drop the schema
        deleteTables().finally(() => { done(); });
    });

    function joinGameJson(player:CribbagePlayer, token:string): string {
        return JSON.stringify({
            user_name: `${player.name}`,
            token:`${token}`
        });
    }

    function addPlayersAndTeams() {
        let currentGame = cribRoutes.currentGame;
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

    function makeRoute(route:string): string {
        return `${CribbageRoutePrefix}${route}`;
    }

    function playCard(agent:any, player:CribbagePlayer, card:BaseCard, cb:Function) {
        agent.post(makeRoute(CribbageRoutes.Routes.playCard))
            .type('json')
            .send(JSON.stringify({
                token: Tokens.playCard,
                user_name: player.name,
                text: card.shortString()
            }))
            .expect(200, cb);
    }

    function go(agent:any, player:CribbagePlayer, cb:Function) {
        agent.post(makeRoute(CribbageRoutes.Routes.go))
            .type('json')
            .send(JSON.stringify({
                token: Tokens.go,
                user_name: player.name
            }))
            .expect(200, cb);
    }

    function expectSuccess<TableClass>(result:DBReturn<TableClass>) {
        expect(result.status).toEqual(DBReturnStatus.ok);
    }

    function findPlayerInDatabase(player:CribbagePlayer): Q.Promise<number> {
        // Expect the player to be in the 'player' database table
        var playerID = 0;
        return new Q.Promise((resolve) => {
            return player_actions.findByName(player.name)
                .then((result:PlayerReturn) => {
                    expectSuccess(result);
                    playerID = result.first().id;
                    return findGameHistoryPlayer(playerID);
                })
                .then(() => resolve(playerID));
        });
    }

    function findGameInDatabase(): Q.Promise<void> {
        return game_actions.findByName(Games.Cribbage)
            .then((result:GameReturn) => {
                expectSuccess(result);
                cribbageID = result.first().id;
                // Find the game history
                return game_history_actions.findMostRecent(cribbageID);
            })
            .then((result:GameHistoryReturn) => {
                expectSuccess(result);
                currentGameID = result.first().id;
            });
    }

    function findGameHistoryPlayer(player_id:number): Q.Promise<void> {
        return game_history_player_actions.findAssociation(player_id, currentGameID)
            .then((result:GameHistoryPlayerReturn) => {
                expectSuccess(result);
            });
    }

    function findCribbageHandHistory(player_id:number, expectedHand:CribbageHand, kitty:boolean, cb:Function) {
        cribbage_hand_history_actions.all(player_id, currentGameID)
            .then((result:CribbageHandHistoryReturn) => {
                verifyReturn(result, "Expected a cribbage hand history result");
                var chh;
                for (let ix = 0; ix < result.result.length; ix++) {
                    let res = result.result[ix];
                    if (kitty == res.is_crib) {
                        // Either this is the kitty or it's not, either way there's a match
                        chh = res;
                        break;
                    }
                }
                var hand = Router.parseCards(chh.hand);
                for (let ix = 0; ix < expectedHand.size(); ix++) {
                    let found = false;
                    let cardx = expectedHand.itemAt(ix);
                    for (let iy = 0; iy < hand.length; iy++) {
                        let cardy = hand[iy];
                        if (cardx.equalsOther(cardy)) {
                            found = true;
                            break;
                        }
                    }
                    expect(found).toBeTruthy(`Couldn't find ${cardx.toString()}`);
                }
                expect(cut).toEqual(chh.cut);
            })
            .finally(() => { cb(); });
    }

    function findWinLossInDatabase(player:string, won:boolean, cb:Function) {
        win_loss_history_actions.get(player)
            .then((result:WinLossHistoryReturn) => {
                verifyReturn(result, "Expected a win-loss history result");
                expect(result.first().won).toEqual(won);
            })
            .finally(() => { cb(); });
    }

    function joinGameAndBeginSeries(agent) {
        return [
            function(cb) {
                // Reset the game
                agent.post(makeRoute(CribbageRoutes.Routes.resetGame))
                    .type('json')
                    .send(JSON.stringify({text:"secret", token:Tokens.resetGame}))
                    .expect(200, cb);
            },
            function(cb) {
                // Peter Griffin joins the game
                agent.post(makeRoute(CribbageRoutes.Routes.joinGame))
                    .type('json')
                    .send(joinGameJson(PeterGriffin, Tokens.joinGame))
                    .expect(200, cb);
            },
            function(cb) {
                // Homer Simpson joins the game
                agent.post(makeRoute(CribbageRoutes.Routes.joinGame))
                    .type('json')
                    .send(joinGameJson(HomerSimpson, Tokens.joinGame))
                    .expect(200, cb);
            },
            function(cb) {
                // Intercept the dealing and assign our own hands
                let currentGame = cribRoutes.currentGame;
                spyOn(currentGame, "begin").andCall(() => {
                    // Initialize the players and teams
                    addPlayersAndTeams();
                    // Assign the dealer
                    currentGame.dealer = PeterGriffin;
                    currentGame.nextPlayerInSequence = HomerSimpson;
                    // Assign the hands
                    PeterGriffin.hand = pgHand;
                    HomerSimpson.hand = hsHand;
                });
                // Begin the game
                agent.get(makeRoute(CribbageRoutes.Routes.beginGame))
                    .query({token: `${Tokens.beginGame}`})
                    .expect(200)
                    .expect((res) => {
                        var response = <CribbageResponseData>JSON.parse(res.text);
                        if (response.text.indexOf(CribbageStrings.MessageStrings.FMT_START_GAME) == -1)
                            return true; // Return true to indicate an error, see the SuperTest documentation
                    })
                    .end(cb);
            },
            function(cb) {
                // Find the game, game_history, and player in the database
                findGameInDatabase()
                    .then(() => { return findPlayerInDatabase(PeterGriffin); })
                    .then((playerID:number) => { pgID = playerID; })
                    .then(() => { return findPlayerInDatabase(HomerSimpson); })
                    .then((playerID:number) => { hsID = playerID; })
                    .finally(() => { cb(); });
            }
        ];
    }

    function throwCardsSeries(agent) {
        return [
            function (cb) {
                // throw cards
                agent.post(makeRoute(CribbageRoutes.Routes.throwCard))
                    .type('json')
                    .send(JSON.stringify({
                        token:Tokens.throwCard,
                        user_name: PeterGriffin.name,
                        text: `${tenOfSpades.shortString()} ${jackOfClubs.shortString()}`
                    }))
                    .expect(200, () => {
                        crib.addItems([tenOfSpades, jackOfClubs]);
                        cb();
                    });
            },
            function (cb) {
                let currentGame = cribRoutes.currentGame;
                spyOn(currentGame, "cutTheDeck").andCall(() => {
                    // Set the cut card
                    currentGame.cut = cut;
                });
                // throw cards
                agent.post(makeRoute(CribbageRoutes.Routes.throwCard))
                    .type('json')
                    .send(JSON.stringify({
                        token:Tokens.throwCard,
                        user_name: HomerSimpson.name,
                        text: `${nineOfSpades.shortString()} ${tenOfHearts.shortString()}`
                    }))
                    .expect(200, () => {
                        crib.addItems([nineOfSpades, tenOfHearts]);
                        cb();
                    });
            }
        ];
    }

    function playCardsSeries(agent) {
        return [
            // Play cards
            function (cb) {
                // 7
                playCard(agent, HomerSimpson, sevenOfClubs, cb);
            },
            function (cb) {
                // 11
                playCard(agent, PeterGriffin, fourOfSpades, cb);
            },
            function (cb) {
                // 18
                playCard(agent, HomerSimpson, sevenOfHearts, cb);
            },
            function (cb) {
                // 24
                playCard(agent, PeterGriffin, sixOfClubs, cb);
            },
            function (cb) {
                // 30 for 2
                playCard(agent, HomerSimpson, sixOfDiamonds, cb);
            },
            function (cb) {
                // go
                go(agent, PeterGriffin, cb);
            },
            function (cb) {
                // go
                go(agent, HomerSimpson, cb);
            },
            function (cb) {
                // 6
                playCard(agent, PeterGriffin, sixOfSpades, cb);
            },
            function (cb) {
                // 14
                playCard(agent, HomerSimpson, eightOfClubs, cb);
            },
            function (cb) {
                // 19
                playCard(agent, PeterGriffin, fiveOfDiamonds, cb);
            }
        ];
    }

    it("lets players join the game and begin", function(done) {
        var agent = request(this.app);
        async.series(joinGameAndBeginSeries(agent), done);
    });

    it("describes the current game", function(done) {
        var agent = request(this.app);
        var series = joinGameAndBeginSeries(agent).concat(
            function(cb) {
                //Get the description
                agent.get(makeRoute(CribbageRoutes.Routes.describe))
                    .query({token: `${Tokens.describe}`})
                    .expect(200)
                    .expect(function(res) {
                        var response = <CribbageResponseData>JSON.parse(res.text);
                        var description:CribbageGameDescription = JSON.parse(response.text);
                        var hasDealer = (description.dealer == PeterGriffin.name || description.dealer == HomerSimpson.name);
                        expect(hasDealer).toBe(true);
                    })
                    .end(cb);
            });
        async.series(series, done);
    });

    it("is able to show a player's cards", function(done) {
        // Disable the test by default since I don't want the test to download card images
        var runShowHands = false;
        if (runShowHands) {
            var agent = request(this.app);
            var series = joinGameAndBeginSeries(agent).concat(
                function (cb) {
                    // Show player one's hand
                    agent.get(makeRoute(CribbageRoutes.Routes.showHand))
                        .query({token: `${Tokens.showHand}`, user_name: PeterGriffin.name})
                        .expect(200)
                        .end(cb);
                });
            async.series(series, done);
        }
        else {
            done();
        }
    });

    it("is able to play and store a round of play", function(done) {
        var agent = request(this.app);
        var series = joinGameAndBeginSeries(agent)
            .concat(throwCardsSeries(agent))
            .concat(playCardsSeries(agent))
            .concat([
                // Check the database for the correct hand history
                function (cb) {
                    findCribbageHandHistory(pgID, pgHand, false, cb);
                },
                function (cb) {
                    findCribbageHandHistory(hsID, hsHand, false, cb);
                },
                function (cb) {
                    findCribbageHandHistory(pgID, crib, true, cb);
                }
            ]);
        async.series(series, done);
    });

    it("is able to record a win", function(done) {
        var agent = request(this.app);
        var series = joinGameAndBeginSeries(agent)
            .concat(throwCardsSeries(agent))
            .concat([
                function (cb) {
                    // Make one of the players have enough points to win
                    cribRoutes.currentGame.players.findPlayer(PeterGriffin.name).points = 120;
                    playCard(agent, HomerSimpson, sixOfDiamonds, cb);
                },
                function (cb) {
                    // Should be game over
                    playCard(agent, PeterGriffin, sixOfClubs, cb);
                }
            ])
            .concat([
                // Check the database for the correct hand history
                function (cb) {
                    findCribbageHandHistory(pgID, pgHand, false, cb);
                },
                function (cb) {
                    findCribbageHandHistory(hsID, hsHand, false, cb);
                },
                function (cb) {
                    findCribbageHandHistory(pgID, crib, true, cb);
                },
                // Check that it recorded the win/loss
                function (cb) {
                    findWinLossInDatabase(PeterGriffin.name, true, cb);
                },
                function (cb) {
                    findWinLossInDatabase(HomerSimpson.name, false, cb);
                }
            ]);
        async.series(series, done);
    });
});