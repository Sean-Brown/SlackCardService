/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../card_service/base_classes/collections/hand.ts" />
/// <reference path="../../card_service/implementations/cribbage_player.ts" />
/// <reference path="../../card_service/implementations/cribbage_team.ts" />
/// <reference path="../../card_service/implementations/cribbage.ts" />
/// <reference path="../../card_service/base_classes/card_game.ts" />

import {BaseCard, Suit, Value} from "../../card_service/base_classes/items/card";
import {BaseHand} from "../../card_service/base_classes/collections/hand";
import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {CribbageTeam} from "../../card_service/implementations/cribbage_team";
import {Cribbage, CribbageGameDescription, CribbageStrings} from "../../card_service/implementations/cribbage";
import {BaseCardGame, Players, Sequence} from "../../card_service/base_classes/card_game";
import {CribbageHand} from "../../card_service/implementations/cribbage_hand";
import {ItemCollection} from "../../card_service/base_classes/collections/item_collection";
import {setup, CribbageRoutePrefix} from "../../app";
import {createNewServer} from "./setup";
import {CribbageRoutes} from "../../routes/Cribbage/index";
import Response = Express.Response;
import CribbageResponseData = CribbageRoutes.CribbageResponseData;

"use strict";

var request = require("supertest"),
    async   = require("async"),
    expect  = require("expect");

describe("Integration test the Cribbage game between two players", function() {
    var PeterGriffin:CribbagePlayer, HomerSimpson:CribbagePlayer;

    /*
       Before each test, make sure to create a fresh instance of the application
       in order to ensure the state of the server is reset between each test run
     */
    beforeEach(function() {
        createNewServer(this);
        PeterGriffin = new CribbagePlayer("Peter Griffin", new CribbageHand([]));
        HomerSimpson = new CribbagePlayer("Homer Simpson", new CribbageHand([]));
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
            process.env.TMP_CARDS_PATH = "../../public/cards";
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