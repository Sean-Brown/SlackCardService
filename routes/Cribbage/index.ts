/// <reference path="../../typings/index.d.ts" />
import request = require("request");
import {Request, Response} from "express";
import {CribbagePlayer} from "../../card_service/implementations/cribbage_player";
import {Cribbage, CribbageStrings, CribbageReturn} from "../../card_service/implementations/cribbage";
import {CribbageHand} from "../../card_service/implementations/cribbage_hand";
import {BaseCard as Card, Value, Suit} from "../../card_service/base_classes/items/card";
import {ImageManager} from "./helpers/image_manager";
import {SlackResponseType} from "../slack";
import {DBRoutes} from "./database";
import {PostgresTables} from "../../db/implementation/postgres/create_tables";
import {cribbage_hand_history_actions} from "../../db/implementation/postgres/cribbage_hand_history_actions";
import {CribbageHandHistoryReturn, DBReturnStatus, WinLossHistoryReturn} from "../../db/abstraction/return/db_return";
import {CribbageHandHistory} from "../../db/abstraction/tables/cribbage_hand_history";
import {win_loss_history_actions} from "../../db/implementation/postgres/win_loss_history_actions";
import {WinLossHistory} from "../../db/abstraction/tables/win_loss_history";
import {CribbageService} from "./service/cribbage_service";
import {
    CribbageServiceResponse, GameAssociationResponse, CribbageReturnResponse,
    CurrentGameResponse, CribbageHandResponse, GetUnfinishedGamesResponse, GetCurrentGameResponse
} from "./service/lib/response";
import {Player} from "../../db/abstraction/tables/player";
var Q = require("q");

// TODO: write tests for this module, possibly decompose into smaller pieces

export module CribbageRoutes {

    import MessageStrings = CribbageStrings.MessageStrings;
    import CribbageHandHistoryResponse = DBRoutes.CribbageHandHistoryResponse;
    import Result = jasmine.Result;

    class CribbageAttachmentField {
        constructor(
            public title: string = "", // Shown as a bold heading above the value text. It cannot contain markup and will be escaped for you.
            public value: string = "", // The text value of the field. It may contain standard message markup and must be escaped as normal. May be multi-line.
            public short: string ="" // An optional flag indicating whether the value is short enough to be displayed side-by-side with other values.
        ){
        }
    }
    /**
     * https://api.slack.com/docs/attachments
     */
    class CribbageResponseAttachment {
        constructor(
            public text: string = "", // This is the main text in a message attachment, and can contain standard message markup
            public fallback: string = "", // Required plain-text summary of the attachment
            public image_url: string = "", // A valid URL to an image file that will be displayed inside a message attachment. We currently support the following formats: GIF, JPEG, PNG, and BMP.
            public pretext: string = "", // Optional text that appears above the attachment block
            public thumb_url: string = "", // A valid URL to an image file that will be displayed as a thumbnail on the right side of a message attachment. We currently support the following formats: GIF, JPEG, PNG, and BMP.
            public color: string = "", // An optional value that can either be one of good, warning, danger, or any hex color code
            public author_name: string = "", // Small text used to display the author's name.
            public author_link: string = "", // A valid URL that will hyperlink the author_name text mentioned above. Will only work if author_name is present.
            public author_icon: string = "", // A valid URL that displays a small 16x16px image to the left of the author_name text. Will only work if author_name is present.
            public title: string = "", // The title is displayed as larger, bold text near the top of a message attachment
            public title_link: string = "", // By passing a valid URL in the title_link parameter (optional), the title text will be hyperlinked.
            public fields: Array<CribbageAttachmentField> = [] // Fields are defined as an array, and hashes contained within it will be displayed in a table inside the message attachment.
        ){
        }
    }

    export class CribbageResponseData {
        constructor(
            public response_type: SlackResponseType = SlackResponseType.ephemeral,
            public text: string = "",
            public attachments: Array<CribbageResponseAttachment> = []
        ) {
        }
    }

    export class CribbageResponse {
        constructor(public status:number, public data:CribbageResponseData) {
        }
    }

    export class Tokens {
        public static get joinGame() { return process.env.ST_JOIN_GAME; }
        public static get describe() { return process.env.ST_DESCRIBE; }
        public static get resetGame() { return process.env.ST_RESET_GAME; }
        public static get beginGame() { return process.env.ST_BEGIN_GAME; }
        public static get showHand() { return process.env.ST_SHOW_HAND; }
        public static get playCard() { return process.env.ST_PLAY_CARD; }
        public static get throwCard() { return process.env.ST_THROW_CARD; }
        public static get go() { return process.env.ST_GO; }
        public static get unfinishedGames() { return process.env.ST_UNFINISHED_GAMES; }
        public static get leaveGame() { return process.env.ST_LEAVE_GAME; }
        public static get currentGame() { return process.env.ST_CURRENT_GAME; }
    }

    export class Routes {
        public static get joinGame() { return "/joinGame"; }
        public static get beginGame() { return "/beginGame"; }
        public static get resetGame() { return "/resetGame"; }
        public static get describe() { return "/describe"; }
        public static get showHand() { return "/showHand"; }
        public static get playCard() { return "/playCard"; }
        public static get throwCard() { return "/throw"; }
        public static get go() { return "/go"; }
        public static get unfinishedGames() { return "/unfinishedGames"; }
        public static get leaveGame() { return "/leaveGame"; }
        public static get currentGame() { return "/currentGame"; }
    }

    function removeSpaces(str:string):string {
        return str.replace(/\s+/g, "");
    }

    export class Router {
        public cribbage_service:CribbageService = new CribbageService();

        // Initialize the router by getting data that it needs
        public init():Q.Promise<void> {
            let that = this;
            return new Q.Promise((resolve, reject) => {
                PostgresTables.createTables().then((errors:string) => {
                    if (errors.length > 0) {
                        console.log("failed to create the postgres tables");
                        reject();
                    }
                    else {
                        resolve(that.cribbage_service.init());
                    }
                });
            });
        }

        static PLAYER_HAND_EMOJI:string = ":flower_playing_cards:";
        static IMAGE_MANAGER:ImageManager = new ImageManager();
        static VALIDATION_FAILED_RESPONSE: CribbageResponse =
            new CribbageResponse(500,
                new CribbageResponseData(SlackResponseType.ephemeral, "Token validation failed")
            );

        /* ***** Helper Methods ***** */

        private static makeResponse(
            status:number=200,
            text:string="",
            response_type:SlackResponseType=SlackResponseType.ephemeral,
            attachments:Array<CribbageResponseAttachment>=[]
        ): CribbageResponse {
            return new CribbageResponse(status, new CribbageResponseData(response_type, text, attachments));
        }

        private static makeErrorResponse(
            text:string,
            response_type:SlackResponseType=SlackResponseType.ephemeral,
            status:number=500,
            attachments:Array<CribbageResponseAttachment>=[]
        ): CribbageResponse {
            return Router.makeResponse(status, text, response_type, attachments);
        }

        private static sendResponse(response:CribbageResponse, res:Response):void {
            res.status(response.status).header("content-type", "application/json").json(response.data);
        }

        private static sendDelayedResponse(responseData:CribbageResponseData, url:string, delay:number=0):void {
            if (url && url.length > 0) {
                setTimeout(() => {
                    try {
                        request.post(url).json(responseData);
                    }
                    catch (e) {
                        console.log(`Exception caught in sendDelayedResponse: ${e}`);
                    }
                }, delay);
            }
        }

        private static getPlayerName(req:Request):string {
            return (req.body.user_name ? req.body.user_name : req.query.user_name ? req.query.user_name : "Unknown Player");
        }

        private static getRequestInt(req:Request):number {
            let ret = parseInt(req.body.text ? req.body.text : req.query.text ? req.query.text : 0);
            if (!ret) {
                ret = CribbageService.INVALID_ID;
            }
            return ret;
        }

        private static getRequestText(req:Request):string {
            return req.body.text ? req.body.text : req.query.text ? req.query.text : "";
        }

        private static getResponseUrl(req:Request):string {
            return (req.body.response_url ? req.body.response_url : req.query.response_url ? req.query.response_url : "");
        }

        /**
         * Use the token sent across in the request to verify the request
         * @param req {Request}
         * @param route
         * @returns {boolean}
         * SB TODO: Refactor into middleware
         */
        private static verifyRequest(req:Request, route:Routes):boolean {
            var verified = false;
            var token = (req.body.token ? req.body.token : req.query.token ? req.query.token : null);
            switch (route) {
                case Routes.joinGame: verified = (token == Tokens.joinGame); break;
                case Routes.describe: verified = (token == Tokens.describe); break;
                case Routes.beginGame: verified = (token == Tokens.beginGame); break;
                case Routes.resetGame: verified = (token == Tokens.resetGame); break;
                case Routes.showHand: verified = (token == Tokens.showHand); break;
                case Routes.playCard: verified = (token == Tokens.playCard); break;
                case Routes.throwCard: verified = (token == Tokens.throwCard); break;
                case Routes.go: verified = (token == Tokens.go); break;
                case Routes.leaveGame: verified = (token == Tokens.leaveGame); break;
                case Routes.unfinishedGames: verified = (token == Tokens.unfinishedGames); break;
            }
            return verified;
        }

        /**
         * Parse the cards out of the request
         * @param text the text from the request
         * @returns {BaseCard} the parsed card
         * @throws CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX if parsing fails
         */
        public static parseCards(text: string):Array<Card> {
            if (!text)
                throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
            // Strip out all the spaces
            text = removeSpaces(text);
            var textLen = text.length;
            if (textLen == 0 || textLen == 1)
                throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
            var cards = [];
            var ix = 0;
            while (ix < textLen) {
                var charValue = text.charAt(ix).toLowerCase(), charSuit = text.charAt(ix+1).toLowerCase();
                var value: Value, suit: Suit;
                switch (charValue) {
                    case 'a': value = Value.Ace; break;
                    case '2': value = Value.Two; break;
                    case '3': value = Value.Three; break;
                    case '4': value = Value.Four; break;
                    case '5': value = Value.Five; break;
                    case '6': value = Value.Six; break;
                    case '7': value = Value.Seven; break;
                    case '8': value = Value.Eight; break;
                    case '9': value = Value.Nine; break;
                    // allow for the player to enter '10' or 't' for a ten
                    case 't': value = Value.Ten; break;
                    case '1':
                        if (charSuit != "0")
                            throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                        else
                            value = Value.Ten;
                        // set the suit character to the next character
                        if (ix + 2 < textLen) {
                            charSuit = text.charAt(ix+2).toLowerCase();
                            ix++;
                        }
                        break;
                    case 'j': value = Value.Jack; break;
                    case 'q': value = Value.Queen; break;
                    case 'k': value = Value.King; break;
                    default: throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                }
                switch (charSuit) {
                    case 'h': suit = Suit.Hearts; break;
                    case 's': suit = Suit.Spades; break;
                    case 'd': suit = Suit.Diamonds; break;
                    case 'c': suit = Suit.Clubs; break;
                    default: throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                }
                cards.push(new Card(suit, value));
                ix += 2;
            }
            return cards;
        }

        private static roundOverResetImages(game:Cribbage):void {
            Router.resetHandImages(game);
            Router.resetSequenceImages();
        }

        private static resetHandImages(game:Cribbage):void {
            if (game) {
                Router.IMAGE_MANAGER.clearHands(game.players.items);
            }
        }

        private static resetSequenceImages():void {
            Router.IMAGE_MANAGER.clearSequence();
        }

        private static checkPlayersResult(players:Array<Player>, gameHistoryID:number, cb:Function):void {
            if (players.length > 0) {
                cb();
            }
            else {
                console.error(`unable to find the players for GameHistory ID ${gameHistoryID}`)
            }
        }

        /**
         * Record each player's hand and the kitty in the database
         * @note always resolves
         * @returns an error string, if there was an error, otherwise an empty string
         */
        private recordCribbageHands(gameHistoryID:number, game:Cribbage, players:Array<Player>): Q.Promise<string> {
            return new Q.Promise((resolve) => {
                var chhs = [];
                // Find the dealer's ID
                let dealer_id = 0, dealer_name = game.dealer.name.toUpperCase();
                for (let ix = 0; ix < players.length; ix++) {
                    let player = players[ix];
                    if (dealer_id == 0 && player.name.toUpperCase() == dealer_name) {
                        dealer_id = player.id;
                    }
                    // Find the corresponding player in the Cribbage game in order to find their hand
                    let gamePlayer:CribbagePlayer = game.players.findPlayer(player.name);
                    chhs.push(
                        new CribbageHandHistory(0, player.id, gameHistoryID, gamePlayer.hand.toShortString(), game.cut.shortString())
                    );
                }
                // Add the kitty
                chhs.push(
                    new CribbageHandHistory(0, dealer_id, gameHistoryID, game.kitty.toShortString(), game.cut.shortString(), true)
                );
                cribbage_hand_history_actions.createMany(chhs)
                    .then((result:CribbageHandHistoryReturn) => {
                        if (result.status != DBReturnStatus.ok) {
                            // Something went wrong
                            resolve(result.message);
                        }
                        else {
                            // Success!
                            resolve("");
                        }
                    });
            });
        }

        /**
         * Record the winners and losers in the database, send a response to the channel if something fails
         * @note this method always resolves
         * @param req
         * @param gameHistoryID
         * @param game
         * @param players
         * @returns {Q.Promise} an error string if an error occurred, otherwise an empty string
         */
        private recordResult(req:Request, gameHistoryID:number, game:Cribbage, players:Array<Player>) {
            let histories = [];
            console.log(`Recording win-loss history for ${gameHistoryID}`);
            for (let ix = 0; ix < players.length; ix++) {
                let player = players[ix];
                histories.push(
                    new WinLossHistory(0, player.id, gameHistoryID, game.wonGame(player.name))
                );
            }
            win_loss_history_actions.createMany(histories)
                .then((result:WinLossHistoryReturn) => {
                    if (result.status != DBReturnStatus.ok) {
                        // Something went wrong
                        console.error(result.message);
                        Router.sendDelayedResponse(
                            Router.makeErrorResponse(result.message, SlackResponseType.in_channel).data,
                            Router.getResponseUrl(req)
                        );
                    }
                    else {
                        // Success!
                        console.log(`Successfully recorded win-loss history for game ${result.first().game_history_id}`);
                    }
                });
        }

        /**
         * Acknowledge the request by sending an empty response
         * @param res
         */
        private static acknowledgeRequest(res:Response): void {
            Router.sendResponse(Router.makeResponse(), res);
        }

        /**
         * NOTE:
         * A new Game should be created by playerIDs joining the game via "joinGame",
         * then calling "beginGame" when all have joined
         */

        /* ***** ROUTES ***** */

        /* ***** Getting unfinished games ***** */

        getUnfinishedGames(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.unfinishedGames)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    let player = Router.getPlayerName(req);
                    let override = Router.getRequestText(req);
                    let playerToUse = ((override.length > 0) ? override : player);
                    this.cribbage_service.getUnfinishedGames(playerToUse)
                        .then((result:GetUnfinishedGamesResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(
                                    Router.makeErrorResponse(result.message).data,
                                    resUrl
                                );
                            }
                            else {
                                let ghids = result.gameHistoryIDs;
                                Router.sendDelayedResponse(
                                    Router.makeResponse(
                                        200,
                                        ((ghids.length > 0) ? ghids.join(", ") : `${playerToUse} has no unfinished games`)
                                    ).data,
                                    resUrl
                                );
                            }
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

        getCurrentGame(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.currentGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    let player = Router.getPlayerName(req);
                    this.cribbage_service.getCurrentGame(player)
                        .then((gameID:number) => {
                            const resType = SlackResponseType.ephemeral;
                            if (gameID < 0) {
                                Router.sendDelayedResponse(
                                    new CribbageResponseData(resType, "You haven't joined a game yet"),
                                    resUrl
                                );
                            }
                            else if (gameID == 0) {
                                Router.sendDelayedResponse(
                                    new CribbageResponseData(resType, "You've joined the new game that has not yet begun"),
                                    resUrl
                                );
                            }
                            else {
                                Router.sendDelayedResponse(
                                    new CribbageResponseData(resType, `You're currently in game ${gameID}`),
                                    resUrl
                                );
                            }
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

        /* ***** Initializing the Game ***** */

        joinGame(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.joinGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    let player = Router.getPlayerName(req);
                    let gameHistoryID = Router.getRequestInt(req);
                    this.cribbage_service.joinGame(player, gameHistoryID)
                        .then((result:CribbageServiceResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(
                                    Router.makeErrorResponse(result.message).data,
                                    resUrl
                                );
                            }
                            else {
                                Router.sendDelayedResponse(
                                    Router.makeResponse(
                                        200,
                                        `${player} has joined the game`,
                                        SlackResponseType.in_channel
                                    ).data,
                                    resUrl
                                );
                            }
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

        beginGame(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.beginGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    this.cribbage_service.beginGame(Router.getPlayerName(req))
                        .then((result:GameAssociationResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(
                                    Router.makeErrorResponse(result.message, SlackResponseType.in_channel).data,
                                    Router.getResponseUrl(req)
                                );
                            }
                            else {
                                let ga = result.gameAssociation;
                                let response = Router.makeResponse(200, CribbageStrings.MessageStrings.FMT_START_GAME, SlackResponseType.in_channel);
                                response.data.text = `${CribbageStrings.MessageStrings.FMT_START_GAME}${ga.game.dealer.name}'s crib.`;
                                response.data.attachments.push(
                                    new CribbageResponseAttachment(`Players: ${ga.game.printPlayers()}`)
                                );
                                Router.sendDelayedResponse(response.data, resUrl);
                            }
                        });
                }
                catch (e) {
                    // SB TODO: Elaborate on what went wrong
                    Router.sendDelayedResponse(
                        Router.makeErrorResponse(
                            `Cannot start the game, an error has occurred: ${e}`,
                            SlackResponseType.in_channel
                        ).data,
                        resUrl
                    );
                }
            }
        }

        resetGame(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.resetGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                var secret = req.body.text;
                var result = this.cribbage_service.resetGame(secret);
                if (result.status == DBReturnStatus.ok) {
                    Router.sendResponse(
                        Router.makeResponse(200, CribbageStrings.MessageStrings.GAME_RESET, SlackResponseType.ephemeral),
                        res
                    );
                }
                else {
                    var response = Router.makeResponse(200, `The new game was reset by ${Router.getPlayerName(req)}`);
                    Router.sendResponse(response, res);
                }
            }
        }


        /* ***** Run of play ***** */

        leaveGame(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.leaveGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    let player = Router.getPlayerName(req);
                    this.cribbage_service.leaveGame(player)
                        .then((result:CribbageServiceResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(
                                    Router.makeErrorResponse(result.message).data,
                                    resUrl
                                );
                            }
                            else {
                                Router.sendDelayedResponse(
                                    Router.makeResponse(
                                        200,
                                        result.message
                                    ).data,
                                    resUrl
                                );
                            }
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

        describe(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.describe)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let result = this.cribbage_service.describe(Router.getRequestInt(req));
                Router.sendResponse(Router.makeResponse(200, result.message), res);
            }
        }

        showHand(req:Request, res:Response) {
            if (!Router.verifyRequest(req, Routes.showHand)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    // Acknowledge the request
                    Router.sendResponse(Router.makeResponse(200, "creating your hand's image..."), res);
                    let player = Router.getPlayerName(req);
                    this.cribbage_service.getPlayerHand(player)
                        .then((result:CribbageHandResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(Router.makeErrorResponse(result.message).data, resUrl);
                            }
                            else {
                                let hand: CribbageHand = result.hand;
                                if (hand.size() == 0) {
                                    Router.sendDelayedResponse(Router.makeResponse(200, "You played all your cards!").data, resUrl);
                                }
                                else {
                                    Router.IMAGE_MANAGER.getLatestPlayerHand(player, hand)
                                        .then(function (handUrl: string) {
                                            console.log(`adding attachment with url ${handUrl}`);
                                            let resData = new CribbageResponseData(
                                                SlackResponseType.ephemeral,
                                                "",
                                                [new CribbageResponseAttachment(`${Router.PLAYER_HAND_EMOJI}`, "", handUrl)]
                                            );
                                            Router.sendDelayedResponse(resData, resUrl);
                                        })
                                        .catch((err: any) => {
                                            Router.sendDelayedResponse(
                                                Router.makeErrorResponse(err).data,
                                                resUrl
                                            );
                                        });
                                }
                            }
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

        playCard(req:Request, res:Response) {
            let player = Router.getPlayerName(req);
            let card:Card = null;
            let cribRes:CribbageReturn = null;
            let playerGame:Cribbage = null;
            if (!Router.verifyRequest(req, Routes.playCard)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    let cards:Array<Card> = Router.parseCards(req.body.text);
                    if (cards.length == 0)
                        throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                    else if (cards.length > 1)
                        throw CribbageStrings.ErrorStrings.TOO_MANY_CARDS;
                    card = cards[0];
                    if (card == undefined || card.suit == undefined || card.value == undefined) {
                        throw "Parsing the card failed without throwing, so I'm doing it now!";
                    }
                    let that = this;
                    that.cribbage_service.playCard(player, card)
                        .then((result:CribbageReturnResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(Router.makeErrorResponse(result.message).data, resUrl);
                            }
                            else {
                                cribRes = result.cribRes;
                                playerGame = result.game;
                                if (cribRes.gameOver) {
                                    Router.sendDelayedResponse(
                                        Router.makeResponse(200, cribRes.message, SlackResponseType.in_channel).data,
                                        resUrl
                                    );
                                    Router.resetSequenceImages();
                                    // Record the wins/losses in the database
                                    that.cribbage_service.getGamePlayers(result.gameHistoryID)
                                        .then((players: Array<Player>) => {
                                            Router.checkPlayersResult(players, result.gameHistoryID, () => {
                                                that.recordResult(req, result.gameHistoryID, result.game, players);
                                            });
                                        });
                                }
                                else if (cribRes.roundOver) {
                                    // The round is over, use the responseText string
                                    that.cribbage_service.getPlayerGame(player)
                                        .then((result: CurrentGameResponse) => {
                                            if (result.status != DBReturnStatus.ok) {
                                                Router.sendDelayedResponse(
                                                    Router.makeErrorResponse(result.message).data,
                                                    Router.getResponseUrl(req)
                                                );
                                            }
                                            else {
                                                Router.roundOverResetImages(playerGame);
                                            }
                                        });
                                }
                                else {
                                    Router.resetSequenceImages();
                                    // Tell the player what cards they have
                                    let theirHand: CribbageHand = playerGame.getPlayerHand(Router.getPlayerName(req));
                                    let hasHand = (theirHand.size() > 0);
                                    let delayedData = new CribbageResponseData(SlackResponseType.ephemeral);
                                    if (!hasHand)
                                        delayedData.text = "You have no more cards!";
                                    else {
                                        Router.IMAGE_MANAGER.createPlayerHandImageAsync(player, theirHand)
                                            .done(function (handUrl: string) {
                                                delayedData.attachments = [
                                                    new CribbageResponseAttachment(
                                                        `${Router.PLAYER_HAND_EMOJI}  ${player}, your remaining cards are:`,
                                                        "",
                                                        handUrl
                                                    )
                                                ];
                                                Router.sendDelayedResponse(
                                                    delayedData,
                                                    resUrl,
                                                    2000
                                                );
                                            });
                                    }
                                }
                            }
                        });
                    }
                    catch (e) {
                        Router.sendDelayedResponse(
                            Router.makeErrorResponse(`Error! ${e}! Current player: ${playerGame.nextPlayerInSequence.name}`).data,
                            resUrl
                        );
                    }
            }
        }

        throwCard(req:Request, res:Response) {
            let player = Router.getPlayerName(req);
            let resUrl = Router.getResponseUrl(req);
            let cribRes:CribbageReturn = null;
            let currentGame = null;
            let gameHistoryID = 0;
            let that = this;
            if (!Router.verifyRequest(req, Routes.throwCard)) {
                Router.sendDelayedResponse(Router.VALIDATION_FAILED_RESPONSE.data, resUrl);
            }
            else {
                try {
                    Router.acknowledgeRequest(res);
                    let cards:Array<Card> = Router.parseCards(req.body.text);
                    that.cribbage_service.giveToKitty(player, cards)
                        .then((result:CribbageReturnResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(
                                    Router.makeErrorResponse(result.message).data,
                                    Router.getResponseUrl(req)
                                );
                            }
                            else {
                                let cribRes = result.cribRes;
                                currentGame = result.game;
                                gameHistoryID = result.gameHistoryID;
                                if (cribRes.gameOver) {
                                    Router.sendDelayedResponse(
                                        Router.makeResponse(200, cribRes.message, SlackResponseType.in_channel).data,
                                        resUrl
                                    );
                                    Router.roundOverResetImages(currentGame);
                                    // Record the wins/losses in the database
                                    return that.cribbage_service.getGamePlayers(result.gameHistoryID)
                                        .then((players:Array<Player>) => {
                                            Router.checkPlayersResult(players, gameHistoryID, () => {
                                                this.recordResult(req, result.gameHistoryID, result.game, players);
                                            });
                                        });
                                }
                                else {
                                    // Tell the channel the player threw to the crib
                                    Router.sendDelayedResponse(
                                        new CribbageResponseData(
                                            SlackResponseType.in_channel,
                                            `${player} threw to the kitty`
                                        )
                                        , resUrl
                                    );
                                    // Show the player the card they just played
                                    Router.IMAGE_MANAGER.createDiscardImageAsync(player, cards)
                                        .done(function(handUrl:string) {
                                            console.log(`throwCard: returning the player's thrown cards at ${handUrl}`);
                                            Router.sendDelayedResponse(
                                                new CribbageResponseData(
                                                    SlackResponseType.ephemeral,
                                                    "",
                                                    [new CribbageResponseAttachment("The cards you threw:", "", handUrl)]
                                                ),
                                                resUrl,
                                                500
                                            );
                                            // Show the rest of their hand
                                            let theirHand = currentGame.getPlayerHand(player);
                                            if (theirHand.size() > 0) {
                                                Router.IMAGE_MANAGER.createPlayerHandImageAsync(player, theirHand)
                                                    .done(function(handUrl:string) {
                                                        console.log(`throwCard: return player hand at ${handUrl}`);
                                                        Router.sendDelayedResponse(
                                                            new CribbageResponseData(
                                                                SlackResponseType.ephemeral,
                                                                "",
                                                                [new CribbageResponseAttachment(`${Router.PLAYER_HAND_EMOJI}  Your remaining Cards:`, "", handUrl)]
                                                            ),
                                                            resUrl,
                                                            1000
                                                        );
                                                    });
                                            }
                                            else {
                                                Router.sendDelayedResponse(Router.makeResponse(200, "You have no more cards left").data, resUrl);
                                            }
                                        });
                                    // Check if the game's ready to begin
                                    if (currentGame.isReady()) {
                                        that.cribbage_service.getGamePlayers(result.gameHistoryID)
                                            .then((players:Array<Player>) => {
                                                // Record each player's hand plus the kitty in the database
                                                Router.checkPlayersResult(players, gameHistoryID, () => {
                                                    this.recordCribbageHands(result.gameHistoryID, result.game, players)
                                                        .then((error: string) => {
                                                            if (error.length > 0) {
                                                                // Something went wrong
                                                                Router.sendDelayedResponse(
                                                                    Router.makeErrorResponse(`Error saving your hands to the database: ${error}`, SlackResponseType.in_channel).data,
                                                                    Router.getResponseUrl(req)
                                                                );
                                                            }
                                                            // Let the playerIDs know it's time to begin the game
                                                            let text = `The game is ready to begin. Play a card ${currentGame.nextPlayerInSequence.name}.\n` +
                                                                `${Cribbage.cutEmoji}  The cut card is:`;
                                                            if (cribRes.message.length > 0) {
                                                                text = `${cribRes.message}\n${text}`;
                                                            }
                                                            Router.sendDelayedResponse(
                                                                new CribbageResponseData(
                                                                    SlackResponseType.in_channel,
                                                                    "",
                                                                    [new CribbageResponseAttachment(
                                                                        text,
                                                                        "",
                                                                        ImageManager.getCardImageUrl(currentGame.cut)
                                                                    )]
                                                                ),
                                                                resUrl,
                                                                2000
                                                            );
                                                        });
                                                });
                                            });
                                    }
                                }
                            }
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

        go(req:Request, res:Response) {
            let that = this;
            if (!Router.verifyRequest(req, Routes.go)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                let resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    let player = Router.getPlayerName(req);
                    let gameHistoryID = 0, game = null;
                    that.cribbage_service.go(player)
                        .then((result:CribbageReturnResponse) => {
                            if (result.status != DBReturnStatus.ok) {
                                Router.sendDelayedResponse(Router.makeErrorResponse(result.message).data, resUrl);
                            }
                            else {
                                let cribResponse = result.cribRes;
                                let currentGame = result.game;
                                if (cribResponse.gameOver) {
                                    Router.roundOverResetImages(currentGame);
                                    gameHistoryID = result.gameHistoryID;
                                    game = result.game;
                                    Router.sendDelayedResponse(new CribbageResponseData(SlackResponseType.in_channel, cribResponse.message), resUrl);
                                    return that.cribbage_service.getGamePlayers(result.gameHistoryID)
                                }
                                else {
                                    if (currentGame.count == 0) {
                                        Router.resetSequenceImages();
                                    }
                                    Router.sendDelayedResponse(
                                        Router.makeResponse(200, `${player} says "go"`, SlackResponseType.in_channel).data,
                                        resUrl
                                    );
                                }
                            }
                        })
                        .then((players:Array<Player>) => {
                            // Record the wins/losses in the database
                            Router.checkPlayersResult(players, gameHistoryID, () => {
                                this.recordResult(req, gameHistoryID, game, players);
                            });
                        });
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

    }
}