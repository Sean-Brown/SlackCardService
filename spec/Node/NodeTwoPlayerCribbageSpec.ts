/// <reference path="../../typings/index.d.ts" />
/// <reference path="../../card_service/base_classes/collections/hand.ts" />
/// <reference path="../../card_service/implementations/cribbage_player.ts" />
/// <reference path="../../card_service/implementations/cribbage_team.ts" />
/// <reference path="../../card_service/implementations/cribbage.ts" />
/// <reference path="../../card_service/base_classes/card_game.ts" />

import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {CribbageGameDescription, CribbageStrings} from "../../card_service/implementations/cribbage";
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
    GameHistoryReturn, GameHistoryPlayerReturn
} from "../../db/abstraction/return/db_return";
import {game_actions} from "../../db/implementation/postgres/game_actions";
import {Games} from "../../db/implementation/games";
import {game_history_actions} from "../../db/implementation/postgres/game_history_actions";
import {game_history_player_actions} from "../../db/implementation/postgres/game_history_player_actions";

var request = require("supertest"),
    async   = require("async"),
    expect  = require("expect");

describe("Integration test the Cribbage game between two players", function() {
    var PeterGriffin:CribbagePlayer, HomerSimpson:CribbagePlayer,
        cribbageID:number, currentGameID:number;

    /*
       Before all the tests run, make sure to create a fresh instance of the application
       in order to ensure the state of the server is reset between each test run. Also
       ensure that the database tables are created
     */
    beforeEach(function(done) {
        deleteTables()
            .then(() => {
                return createNewServer(this);
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

    var Tokens = {
        joinGame: "WMYyNOpoJRM4dbNBp6x9yOqP",
        describe: "IA5AtVdbkur2aIGw1B549SgD",
        resetGame: "43LROOjSf8qa3KPYXvmxgdt1",
        beginGame: "GECanrrjA8dYMlv2e4jkLQGe",
        showHand: "Xa73JDXrWDnU276yqwremEsO"
    };

    function joinGameJson(player:CribbagePlayer, token:string): string {
        return JSON.stringify({
            user_name: `${player.name}`,
            token:`${token}`
        });
    }

    function expectSuccess<TableClass>(result:DBReturn<TableClass>) {
        expect(result.status).toEqual(DBReturnStatus.ok);
    }

    function expectPlayerInDatabase(player:CribbagePlayer): Q.Promise<void> {
        // Expect the player to be in the 'player' database table
        return player_actions.findByName(player.name)
            .then((result:PlayerReturn) => {
                expectSuccess(result);
                return findGameHistoryPlayer(result.first().id);
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

    function joinGameAndBeginSeries(agent) {
        return [
            function(cb) {
                // Reset the game
                agent.post(CribbageRoutePrefix + CribbageRoutes.Routes.resetGame)
                    .type('json')
                    .send(JSON.stringify({text:"secret", token:Tokens.resetGame}))
                    .expect(200, cb);
            },
            function(cb) {
                // Peter Griffin joins the game
                agent.post(CribbageRoutePrefix + CribbageRoutes.Routes.joinGame)
                    .type('json')
                    .send(joinGameJson(PeterGriffin, Tokens.joinGame))
                    .expect(200, cb);
            },
            function(cb) {
                // Homer Simpson joins the game
                agent.post(CribbageRoutePrefix + CribbageRoutes.Routes.joinGame)
                    .type('json')
                    .send(joinGameJson(HomerSimpson, Tokens.joinGame))
                    .expect(200, cb);
            },
            function(cb) {
                // Begin the game
                agent.get(CribbageRoutePrefix + CribbageRoutes.Routes.beginGame)
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
                    .then(() => { return expectPlayerInDatabase(PeterGriffin); })
                    .then(() => { return expectPlayerInDatabase(HomerSimpson); })
                    .finally(() => { cb(); });
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
                agent.get(CribbageRoutePrefix + CribbageRoutes.Routes.describe)
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
            process.env.TMP_CARDS_PATH = "../public/cards";
            process.env.TMP_HANDS_PATH = "../public/hands";
            var series = joinGameAndBeginSeries(agent).concat(
                function (cb) {
                    // Show player one's hand
                    agent.get(CribbageRoutePrefix + CribbageRoutes.Routes.showHand)
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
});