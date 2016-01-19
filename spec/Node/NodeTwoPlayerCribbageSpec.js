var cribbage_player_1 = require("../../card_service/implementations/cribbage_player");
var cribbage_hand_1 = require("../../card_service/implementations/cribbage_hand");
var app_1 = require("../../app");
var setup_1 = require("./setup");
var index_1 = require("../../routes/Cribbage/index");
"use strict";
var request = require("supertest"), async = require("async"), expect = require("expect");
describe("Integration test the Cribbage game between two players", function () {
    var PeterGriffin, HomerSimpson;
    beforeEach(function () {
        setup_1.createNewServer(this);
        PeterGriffin = new cribbage_player_1.CribbagePlayer("Peter Griffin", new cribbage_hand_1.CribbageHand([]));
        HomerSimpson = new cribbage_player_1.CribbagePlayer("Homer Simpson", new cribbage_hand_1.CribbageHand([]));
    });
    var Tokens = {
        joinGame: "WMYyNOpoJRM4dbNBp6x9yOqP",
        describe: "IA5AtVdbkur2aIGw1B549SgD",
        resetGame: "43LROOjSf8qa3KPYXvmxgdt1",
        beginGame: "GECanrrjA8dYMlv2e4jkLQGe"
    };
    function joinGameJson(player, token) {
        return JSON.stringify({
            user_name: "" + player.name,
            token: "" + token
        });
    }
    function joinGameAndBeginSeries(agent) {
        return [
            function (cb) {
                agent.post(app_1.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.resetGame)
                    .type('json')
                    .send(JSON.stringify({ text: "secret", token: Tokens.resetGame }))
                    .expect(200, cb);
            },
            function (cb) {
                agent.post(app_1.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.joinGame)
                    .type('json')
                    .send(joinGameJson(PeterGriffin, Tokens.joinGame))
                    .expect(200, cb);
            },
            function (cb) {
                agent.post(app_1.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.joinGame)
                    .type('json')
                    .send(joinGameJson(HomerSimpson, Tokens.joinGame))
                    .expect(200, cb);
            },
            function (cb) {
                agent.get(app_1.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.beginGame)
                    .query({ token: "" + Tokens.beginGame })
                    .expect(200)
                    .expect(function (res) {
                    var response = JSON.parse(res.text);
                    if (response.text != index_1.CribbageStrings.MessageStrings.START_GAME)
                        return true;
                })
                    .end(cb);
            }
        ];
    }
    it("lets players join the game and begin", function (done) {
        var agent = request(this.app);
        async.series(joinGameAndBeginSeries(agent), done);
    });
    it("describes the current game", function (done) {
        var agent = request(this.app);
        var series = joinGameAndBeginSeries(agent).concat(function (cb) {
            agent.get(app_1.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.describe)
                .query({ token: "" + Tokens.describe })
                .expect(200)
                .expect(function (res) {
                var response = JSON.parse(res.text);
                var description = JSON.parse(response.text);
                var hasDealer = (description.dealer == PeterGriffin.name || description.dealer == HomerSimpson.name);
                expect(hasDealer).toBe(true);
            })
                .end(cb);
        });
        async.series(series, done);
    });
});
//# sourceMappingURL=NodeTwoPlayerCribbageSpec.js.map