import {CribbagePlayer} from "../../../../card_service/implementations/cribbage_player";
import {deleteTables} from "../../../db/postgres/integration/CreateTablesSpec";
import {CribbageHand} from "../../../../card_service/implementations/cribbage_hand";
import {player_actions} from "../../../../db/implementation/postgres/player_actions";
import {DBReturn, DBReturnStatus} from "../../../../db/abstraction/return/db_return";
import {verifyReturn} from "../../../verifyReturn";
import {game_history_actions} from "../../../../db/implementation/postgres/game_history_actions";
import {game_actions} from "../../../../db/implementation/postgres/game_actions";
import {win_loss_history_actions} from "../../../../db/implementation/postgres/win_loss_history_actions";
import {WinLossHistory} from "../../../../db/abstraction/tables/win_loss_history";
import {CribbageService} from "../../../../routes/Cribbage/service/cribbage_service";
import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import createTables = PostgresTables.createTables;
import {
    CribbageServiceResponse, GetUnfinishedGamesResponse,
    GameAssociationResponse, CribbageReturnResponse
} from "../../../../routes/Cribbage/service/lib/response";
import {game_history_player_actions} from "../../../../db/implementation/postgres/game_history_player_actions";
import {Player} from "../../../../db/abstraction/tables/player";
import {ActiveGames} from "../../../../routes/Cribbage/service/lib/active_games";
import {
    sixOfDiamonds, tenOfSpades, sixOfClubs, fiveOfHearts, fourOfSpades,
    fiveOfDiamonds, tenOfHearts, jackOfDiamonds, jackOfSpades, queenOfClubs, sevenOfHearts, sevenOfClubs, eightOfClubs
} from "../../../StandardCards";
var Q = require("q");

describe("The Cribbage Service", function() {
    var cribbageID;
    var PeterGriffin:CribbagePlayer, pgID:number, HomerSimpson:CribbagePlayer, hsID:number;
    var gameHistories = [], winLossHistories = [];
    var cribbageService;

    /**
     Before all the tests run, make sure to create a fresh instance of the application
     in order to ensure the state of the server is reset between each test run. Also
     ensure that the database tables are created
     */
    beforeEach(function(done) {
        gameHistories = [];
        winLossHistories = [];
        deleteTables()
            .then(() => {
                return createTables();
            })
            .then((error:string) => {
                if (error.length > 0) {
                    done.fail(error);
                }
                else {
                    cribbageService = new CribbageService();
                }
            })
            .finally(() => {
                PeterGriffin = new CribbagePlayer("Peter Griffin", new CribbageHand([]));
                HomerSimpson = new CribbagePlayer("Homer Simpson", new CribbageHand([]));
                done();
            });
    });

    /**
     * Create a row in the database in a generic fashion
     * @param errorMessage the error message to fail with if the method fails
     * @param instance the action class instance, e.g. 'player_actions', 'game_actions', etc.
     * @param method the method to invoke on the action class, e.g. 'create'
     * @param params the parameters to the method
     * @returns {Q.Promise} the ID of the newly created row
     */
    function createRow<ActionClass, ResultType extends DBReturn<any>>(errorMessage:string, instance:ActionClass, method:string, ...params:any[]): Q.Promise<number> {
        return new Q.Promise((resolve) => {
            if (params.length == 1) {
                instance[method](params[0])
                    .then((result: ResultType) => {
                        verifyReturn(result, errorMessage);
                        resolve(result.first().id);
                    });
            }
            else {
                instance[method](...params)
                    .then((result: ResultType) => {
                        verifyReturn(result, errorMessage);
                        resolve(result.first().id);
                    });
            }
        });
    }

    /**
     * Create the player in the database
     * @param player
     * @returns {Q.Promise} the ID of the player
     */
    function createPlayer(player:string): Q.Promise<number> {
        return createRow("Expected a player return", player_actions, "create", player);
    }

    /**
     * Create the game-history row in the database
     * @returns {Q.Promise} the ID of the newly created row
     */
    function createGameHistory(): Q.Promise<number> {
        return createRow("Expected a game-history result", game_history_actions, "create", cribbageID);
    }

    /**
     * Create the game-history row in the database
     * @returns {Q.Promise} the ID of the newly created row
     */
    function createGameHistoryPlayer(playerIDs:Array<number>, gameHistoryID:number): Q.Promise<number> {
        return createRow("Expected a game-history-player result", game_history_player_actions, "createAssociations", playerIDs, gameHistoryID);
    }

    /**
     * Create the win-loss history row in the database
     * @returns {Q.Promise} the ID of the newly created row
     */
    function createWinLossHistory(playerID:number, gameHistoryID:number, won:boolean): Q.Promise<number> {
        var param = new WinLossHistory(0, playerID, gameHistoryID, won);
        return createRow("Expected a win-loss history result", win_loss_history_actions, "create", param);
    }

    /**
     * Create the Cribbage game in the database
     * @returns {Q.Promise} the ID of the game
     */
    function createGame(): Q.Promise<number> {
        return createRow("Expected a game result", game_actions, "create", "cribbage");
    }

    /**
     * Initialize the game, players, etc in the database, then initialize the cribbage service
     * @returns {Promise<Q.Promise<string>>}
     */
    function initialize(): Q.Promise<string> {
        // Create the Cribbage game
        return createGame()
            .then((id:number) => {
                cribbageID = id;
                // Create playerIDs
                return createPlayer(PeterGriffin.name);
            })
            .then((id:number) => {
                pgID = id;
                return createPlayer(HomerSimpson.name);
            })
            .then((id:number) => {
                hsID = id;
                let playerIDs = [pgID, hsID];
                // Create games and record some of them in the win-loss history table
                return createGameHistory()
                    .then((id:number) => {
                        gameHistories.push(id);
                        return createGameHistoryPlayer(playerIDs, id);
                    })
                    .then(() => {
                        return createGameHistory()
                    })
                    .then((id:number) => {
                        gameHistories.push(id);
                        return createGameHistoryPlayer(playerIDs, id);
                    })
                    .then(() => {
                        return createGameHistory()
                    })
                    .then((id:number) => {
                        gameHistories.push(id);
                        return createGameHistoryPlayer(playerIDs, id);
                    })
                    .then(() => {
                        // Record that last one in the win-loss history table
                        return createWinLossHistory(pgID, gameHistories[0], true);
                    })
                    .then((id:number) => {
                        winLossHistories.push(id);
                        return createWinLossHistory(hsID, gameHistories[0], false);
                    })
            })
            .then((id:number) => {
                winLossHistories.push(id);
                // Now initialize the Cribbage service and make sure it finds the right number of unfinished games
                return cribbageService.init();
            });
    }

    /**
     * Check if initialization failed, if it failed then end the test with done.fail()
     * @param error
     * @param done
     */
    function checkInitialization(error:string, done:any):void {
        if (error.length > 0) {
            done.fail("Failed to initialize the cribbage service");
        }
    }

    it("initializes the unfinished games correctly", function(done) {
        initialize()
            .then((error:string) => {
                checkInitialization(error, done);
                expect(cribbageService.countUnfinishedGames()).toEqual(2);
            })
            .finally(() => { done(); });
    });

    describe("when initialized", function() {
        /**
         * Before each test, initialize the cribbage service
         */
        beforeEach(function(done) {
            initialize()
                .then((error:string) => {
                    checkInitialization(error, done);
                })
                .finally(() => { done(); })
        });

        it("returns an error if describing a non-existant game", function() {
            let ghid = -1;
            let result = cribbageService.describe(ghid);
            expect(result.message.length).toBeGreaterThan(0);
            expect(result.message).toEqual(ActiveGames.gameNotFoundError(ghid));
        });

        it("joins a player to a new game", function(done) {
            let name = PeterGriffin.name;
            cribbageService.joinGame(name)
                .then((result:CribbageServiceResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                    expect(cribbageService.newGame.players.findPlayer(name)).not.toBeNull(`Expected ${name} to be in the game`);
                })
                .finally(() => { done(); });
        });

        it("doesn't throw an error if the same player tries to join the new game more than once", function(done) {
            cribbageService.joinGame(PeterGriffin.name)
                .then((result:CribbageServiceResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                })
                .finally(() => { done(); });
        });

        it("adds an player to the database when they join the new game", function(done) {
            let name = "Zaphod";
            cribbageService.joinGame(name)
                .then((result:CribbageServiceResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                    expect(cribbageService.newGame.players.findPlayer(name)).not.toBeNull(`Expected ${name} to be in the game`);
                })
                .finally(() => { done(); });
        });

        it("can get a player's unfinished games", function(done) {
            cribbageService.getUnfinishedGames(PeterGriffin.name)
                .then((result:GetUnfinishedGamesResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                    expect(result.gameHistoryIDs.length).toEqual(2);
                })
                .finally(() => { done(); });
        });

        it("adds an unknown player to the database if trying to get the unfinished games of an unknown player", function(done) {
            cribbageService.getUnfinishedGames("Zaphod")
                .then((result:GetUnfinishedGamesResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok);
                    expect(result.gameHistoryIDs.length).toEqual(0);
                })
                .finally(() => { done(); });
        });

        it("gets only the players from a given game", function(done) {
            var player = "Sven", pid = CribbageService.INVALID_ID;
            createPlayer(player)
                .then((id:number) => {
                    pid = id;
                    return cribbageService.getUnfinishedGames(PeterGriffin.name);
                })
                .then((result:GetUnfinishedGamesResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok);
                    return cribbageService.getGamePlayers(result.gameHistoryIDs[0]);
                })
                .then((players:Array<Player>) => {
                    expect(players.length).toEqual(2);
                })
                .finally(() => { done(); });
        });

        it("returns an empty array if getting the players from a non-existant game", function(done) {
            cribbageService.getGamePlayers(-1)
                .then((players:Array<Player>) => {
                    expect(players.length).toEqual(0);
                })
                .finally(() => { done(); });
        });

        it("joins a player to an unfinished game", function(done) {
            cribbageService.getUnfinishedGames(PeterGriffin.name)
                .then((result:GetUnfinishedGamesResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                    return cribbageService.joinGame(PeterGriffin.name, result.gameHistoryIDs[0]);
                })
                .then((result:CribbageServiceResponse) => {
                    expect(result.status).toEqual(DBReturnStatus.ok);
                })
                .finally(() => { done(); });
        });

        describe("with players in the new game", function() {
            /**
             * Before each test, add players to the game
             */
            beforeEach(function(done) {
                cribbageService.joinGame(PeterGriffin.name)
                    .then((result:CribbageServiceResponse) => {
                        expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                        return cribbageService.joinGame(HomerSimpson.name);
                    })
                    .then((result:CribbageServiceResponse) => {
                        expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                        expect(cribbageService.newGame.players.countItems()).toEqual(2);
                    })
                    .finally(() => { done(); });
            });

            it("only lets a player in the new game to begin the game", function(done) {
                let player = "Zaphod";
                cribbageService.beginGame(player)
                    .then((result:GameAssociationResponse) => {
                        expect(result.status).toEqual(DBReturnStatus.error);
                        expect(cribbageService.newGame.hasBegun).toBeFalsy("The new game should not have begun yet");
                        return cribbageService.beginGame(HomerSimpson.name);
                    })
                    .then((result:GameAssociationResponse) => {
                        expect(result.status).toEqual(DBReturnStatus.ok);
                        expect(result.gameAssociation).not.toBeNull("Expected a game association object");
                        expect(result.gameAssociation.playerIDs.size).toEqual(2);
                    })
                    .finally(() => { done(); });
            });

            it("only resets the new game if the correct secret was given", function() {
                let result = cribbageService.resetGame("wrong-secret");
                expect(result.status).toEqual(DBReturnStatus.error);
                result = cribbageService.resetGame(process.env.CRIB_RESET_SECRET);
                expect(result.status).toEqual(DBReturnStatus.ok);
            });
        });

        describe("with players in an active game", function() {
            var ghid = 0;
            const cut = fiveOfDiamonds;
            /**
             * Before each test, add the players to an unfinished game
             */
            beforeEach(function(done) {
                ghid = gameHistories[0];
                cribbageService.joinGame(PeterGriffin.name, ghid)
                    .then((result:CribbageServiceResponse) => {
                        expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                        return cribbageService.joinGame(HomerSimpson.name, ghid);
                    })
                    .then((result:CribbageServiceResponse) => {
                        expect(result.status).toEqual(DBReturnStatus.ok, result.message);
                        // Replace each player's hand
                        let gameAssociation = cribbageService.activeGames.activeGames.get(ghid);
                        expect(gameAssociation).not.toBeNull();
                        expect(gameAssociation.game.players.countItems()).toEqual(2);
                        gameAssociation.game.players.findPlayer(PeterGriffin.name).hand =
                            new CribbageHand([fourOfSpades, fiveOfHearts, sixOfClubs, tenOfSpades]);
                        gameAssociation.game.players.findPlayer(HomerSimpson.name).hand =
                            new CribbageHand([tenOfHearts, jackOfDiamonds, jackOfSpades, queenOfClubs]);
                        gameAssociation.game.kitty =
                            new CribbageHand([sixOfDiamonds, sevenOfHearts, sevenOfClubs, eightOfClubs]);
                        gameAssociation.game.cut = cut;
                    })
                    .finally(() => { done(); });
            });

            describe("describes", function() {
                it("describes the current active game", function() {
                    let result = cribbageService.describe(ghid);
                    expect(result.message.length).toBeGreaterThan(0);
                    expect(result.message).not.toEqual(ActiveGames.gameNotFoundError(ghid));
                    expect(result.message).toContain(PeterGriffin.name);
                    expect(result.message).toContain(HomerSimpson.name);
                });
            });

            describe("playing a card", function() {
                it("lets the next player play a card", function(done) {
                    cribbageService.playCard(HomerSimpson.name, jackOfDiamonds)
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.ok);
                        })
                        .finally(() => { done(); });
                });

                it("returns an error if the next player plays a card they do not have", function(done) {
                    cribbageService.playCard(HomerSimpson.name, fourOfSpades)
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.error);
                        })
                        .finally(() => { done(); });
                });

                it("returns an error if a player playing a card is not the next player", function(done) {
                    cribbageService.playCard(PeterGriffin.name, fourOfSpades)
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.error);
                        })
                        .finally(() => { done(); });
                });

                it("returns an error if playing a card in a non-active game", function(done) {
                    cribbageService.playCard("Zaphod", tenOfHearts)
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.error);
                        })
                        .finally(() => { done(); });
                });
            });

            describe("when trying to 'go'", function() {
                it("returns an error if the player can still play", function(done) {
                    cribbageService.go(HomerSimpson.name)
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.error);
                        })
                        .finally(() => { done(); });
                });

                it("lets a player who can't play 'go'", function(done) {
                    cribbageService.playCard(HomerSimpson.name, jackOfDiamonds)
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.ok);
                            return cribbageService.playCard(PeterGriffin.name, tenOfSpades);
                        })
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.ok);
                            return cribbageService.playCard(HomerSimpson.name, jackOfSpades);
                        })
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.ok);
                            return cribbageService.go(PeterGriffin.name);
                        })
                        .then((result:CribbageReturnResponse) => {
                            expect(result.status).toEqual(DBReturnStatus.ok);
                        })
                        .finally(() => { done(); });
                });
            });
        });
    });
});