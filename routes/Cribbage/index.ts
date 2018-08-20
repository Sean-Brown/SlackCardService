import { Request, Response } from 'express';
import * as request from 'request';
import { BaseCard as Card, Suit, Value } from '../../card_service/base_classes/items/card';
import { Cribbage, CribbageReturn, CribbageStrings } from '../../card_service/implementations/cribbage';
import { CribbageHand } from '../../card_service/implementations/cribbage_hand';
import { GameHistoryPlayerActions } from '../../db/actions/game_history_player_actions';
import CribbageHandHistory from '../../db/models/cribbage_hand_history';
import Player from '../../db/models/player';
import WinLossHistory from '../../db/models/win_loss_history';
import { ResponseCode } from '../response_code';
import { SlackResponseType } from '../slack';
import { ImageManager } from './helpers/image_manager';
import { CribbageService } from './service/cribbage_service';

// TODO: write tests for this module, possibly decompose into smaller pieces

export namespace CribbageRoutes {

    class CribbageAttachmentField {
        constructor(
            public title = '', // Shown as a bold heading above the value text. It cannot contain markup and will be escaped for you.
            public value = '', // The text value of the field. It may contain standard message markup and must be escaped as normal. May be multi-line.
            public short = '' // An optional flag indicating whether the value is short enough to be displayed side-by-side with other values.
        ) {
        }
    }

    /* tslint:disable variable-name */
    /**
     * https://api.slack.com/docs/attachments
     */
    class CribbageResponseAttachment {
        constructor(public text = '', // This is the main text in a message attachment, and can contain standard message markup
                    public fallback = '', // Required plain-text summary of the attachment
                    public image_url = '', // A valid URL to an image file that will be displayed inside a message attachment. We currently support the following formats: GIF, JPEG, PNG, and BMP.
                    public pretext = '', // Optional text that appears above the attachment block
                    public thumb_url = '', // A valid URL to an image file that will be displayed as a thumbnail on the right side of a message attachment. We currently support the following formats: GIF, JPEG, PNG, and BMP.
                    public color = '', // An optional value that can either be one of good, warning, danger, or any hex color code
                    public author_name = '', // Small text used to display the author's name.
                    public author_link = '', // A valid URL that will hyperlink the author_name text mentioned above. Will only work if author_name is present.
                    public author_icon = '', // A valid URL that displays a small 16x16px image to the left of the author_name text. Will only work if author_name is present.
                    public title = '', // The title is displayed as larger, bold text near the top of a message attachment
                    public title_link = '', // By passing a valid URL in the title_link parameter (optional), the title text will be hyperlinked.
                    public fields: Array<CribbageAttachmentField> = [] // Fields are defined as an array, and hashes contained within it will be displayed in a table inside the message attachment.
        ) {
        }
    }
    export class CribbageResponseData {
        constructor(public response_type: SlackResponseType = SlackResponseType.ephemeral,
                    public text = '',
                    public attachments: Array<CribbageResponseAttachment> = []) {
        }
    }
    /* tslint:enable */

    export class CribbageResponse {
        constructor(public status: number, public data: CribbageResponseData) {
        }
    }

    export class Tokens {
        public static get joinGame() {
            return process.env.ST_JOIN_GAME;
        }

        public static get describe() {
            return process.env.ST_DESCRIBE;
        }

        public static get resetGame() {
            return process.env.ST_RESET_GAME;
        }

        public static get beginGame() {
            return process.env.ST_BEGIN_GAME;
        }

        public static get showHand() {
            return process.env.ST_SHOW_HAND;
        }

        public static get playCard() {
            return process.env.ST_PLAY_CARD;
        }

        public static get throwCard() {
            return process.env.ST_THROW_CARD;
        }

        public static get go() {
            return process.env.ST_GO;
        }

        public static get unfinishedGames() {
            return process.env.ST_UNFINISHED_GAMES;
        }

        public static get leaveGame() {
            return process.env.ST_LEAVE_GAME;
        }

        public static get currentGame() {
            return process.env.ST_CURRENT_GAME;
        }
    }

    export class Routes {
        public static get joinGame() {
            return '/joinGame';
        }

        public static get beginGame() {
            return '/beginGame';
        }

        public static get resetGame() {
            return '/resetGame';
        }

        public static get describe() {
            return '/describe';
        }

        public static get showHand() {
            return '/showHand';
        }

        public static get playCard() {
            return '/playCard';
        }

        public static get throwCard() {
            return '/throw';
        }

        public static get go() {
            return '/go';
        }

        public static get unfinishedGames() {
            return '/unfinishedGames';
        }

        public static get leaveGame() {
            return '/leaveGame';
        }

        public static get currentGame() {
            return '/currentGame';
        }
    }

    function removeSpaces(str: string): string {
        return str.replace(/\s+/g, '');
    }

    export class Router {
        public cribbageService = new CribbageService();

        // Initialize the router by getting data that it needs
        public async init() {
            await this.cribbageService.init();
        }

        static PLAYER_HAND_EMOJI = ':flower_playing_cards:';
        static IMAGE_MANAGER: ImageManager = new ImageManager();
        static VALIDATION_FAILED_RESPONSE: CribbageResponse =
            new CribbageResponse(500,
                new CribbageResponseData(SlackResponseType.ephemeral, 'Token validation failed')
            );

        /* ***** Helper Methods ***** */

        private static makeResponse(status = 200,
                                    text = '',
                                    responseType = SlackResponseType.ephemeral,
                                    attachments: Array<CribbageResponseAttachment> = []): CribbageResponse {
            return new CribbageResponse(status, new CribbageResponseData(responseType, text, attachments));
        }

        private static makeErrorResponse(text,
                                         responseType = SlackResponseType.ephemeral,
                                         status = 500,
                                         attachments: Array<CribbageResponseAttachment> = []): CribbageResponse {
            console.error(text);
            return Router.makeResponse(status, text, responseType, attachments);
        }

        private static sendResponse(response: CribbageResponse, res: Response): void {
            res.status(response.status).header('content-type', 'application/json').json(response.data);
        }

        private static sendDelayedResponse(responseData: CribbageResponseData, url: string, delay = 0): void {
            if (url && url.length > 0) {
                setTimeout(() => {
                    try {
                        request.post(url).json(responseData);
                    }
                    catch (e) {
                        console.error(`Exception caught in sendDelayedResponse: ${e}`);
                    }
                }, delay);
            }
        }

        private static getPlayerName(req: Request): string {
            return (req.body.user_name ? req.body.user_name : req.query.user_name ? req.query.user_name : 'Unknown Player');
        }

        private static getRequestInt(req: Request): number {
            let ret = parseInt(req.body.text ? req.body.text : req.query.text ? req.query.text : 0);
            if (!ret) {
                ret = CribbageService.INVALID_ID;
            }
            return ret;
        }

        private static getRequestText(req: Request): string {
            return req.body.text ? req.body.text : req.query.text ? req.query.text : '';
        }

        private static getResponseUrl(req: Request): string {
            return (req.body.response_url ? req.body.response_url : req.query.response_url ? req.query.response_url : '');
        }

        /**
         * Use the token sent across in the request to verify the request
         * @param req {Request}
         * @param route
         * @returns {boolean}
         * SB TODO: Refactor into middleware
         */
        private static verifyRequest(req: Request, route: Routes): boolean {
            let verified = false;
            const token = (req.body.token ? req.body.token : req.query.token ? req.query.token : null);
            switch (route) {
                case Routes.joinGame:
                    verified = (token === Tokens.joinGame);
                    break;
                case Routes.describe:
                    verified = (token === Tokens.describe);
                    break;
                case Routes.beginGame:
                    verified = (token === Tokens.beginGame);
                    break;
                case Routes.resetGame:
                    verified = (token === Tokens.resetGame);
                    break;
                case Routes.showHand:
                    verified = (token === Tokens.showHand);
                    break;
                case Routes.playCard:
                    verified = (token === Tokens.playCard);
                    break;
                case Routes.throwCard:
                    verified = (token === Tokens.throwCard);
                    break;
                case Routes.go:
                    verified = (token === Tokens.go);
                    break;
                case Routes.leaveGame:
                    verified = (token === Tokens.leaveGame);
                    break;
                case Routes.unfinishedGames:
                    verified = (token === Tokens.unfinishedGames);
                    break;
                case Routes.currentGame:
                    verified = (token === Tokens.currentGame);
                    break;
            }
            return verified;
        }

        /**
         * Parse the cards out of the request
         * @param text the text from the request
         * @returns {BaseCard} the parsed card
         * @throws CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX if parsing fails
         */
        public static parseCards(text: string): Array<Card> {
            if (!text) {
                throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
            }
            // Strip out all the spaces
            text = removeSpaces(text);
            const textLen = text.length;
            if (textLen === 0 || textLen === 1) {
                throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
            }
            const cards = [];
            let ix = 0;
            while (ix < textLen) {
                const charValue = text.charAt(ix).toLowerCase();
                let charSuit = text.charAt(ix + 1).toLowerCase();
                let value: Value, suit: Suit;
                switch (charValue) {
                    case 'a':
                        value = Value.Ace;
                        break;
                    case '2':
                        value = Value.Two;
                        break;
                    case '3':
                        value = Value.Three;
                        break;
                    case '4':
                        value = Value.Four;
                        break;
                    case '5':
                        value = Value.Five;
                        break;
                    case '6':
                        value = Value.Six;
                        break;
                    case '7':
                        value = Value.Seven;
                        break;
                    case '8':
                        value = Value.Eight;
                        break;
                    case '9':
                        value = Value.Nine;
                        break;
                    // allow for the player to enter '10' or 't' for a ten
                    case 't':
                        value = Value.Ten;
                        break;
                    case '1':
                        if (charSuit !== '0') {
                            throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                        }
                        else {
                            value = Value.Ten;
                        }
                        // set the suit character to the next character
                        if (ix + 2 < textLen) {
                            charSuit = text.charAt(ix + 2).toLowerCase();
                            ix++;
                        }
                        break;
                    case 'j':
                        value = Value.Jack;
                        break;
                    case 'q':
                        value = Value.Queen;
                        break;
                    case 'k':
                        value = Value.King;
                        break;
                    default:
                        throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                }
                switch (charSuit) {
                    case 'h':
                        suit = Suit.Hearts;
                        break;
                    case 's':
                        suit = Suit.Spades;
                        break;
                    case 'd':
                        suit = Suit.Diamonds;
                        break;
                    case 'c':
                        suit = Suit.Clubs;
                        break;
                    default:
                        throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                }
                cards.push(new Card(suit, value));
                ix += 2;
            }
            return cards;
        }

        private static roundOverResetImages(game: Cribbage): void {
            Router.resetHandImages(game);
            Router.resetSequenceImages();
        }

        private static resetHandImages(game: Cribbage): void {
            if (game) {
                Router.IMAGE_MANAGER.clearHands(game.players.items);
            }
        }

        private static resetSequenceImages(): void {
            Router.IMAGE_MANAGER.clearSequence();
        }

        private static async checkPlayersResult(players: Array<Player>, gameHistoryID: number, cb: Function) {
            if (players.length > 0) {
                await cb();
            }
            else {
                console.error(`unable to find the players for GameHistory ID ${gameHistoryID}`);
            }
        }

        /**
         * Record each player's hand and the kitty in the database
         * @throws an error string, if there was an error
         */
        public static async recordCribbageHands(gameHistoryId: number, game: Cribbage, players: Array<Player>) {
            const chhs = [];
            // Find the dealer's ID
            let dealerId = 0;
            const dealerName = game.dealer.name.toUpperCase();
            for (const player of players) {
                if (dealerId === 0 && player.name.toUpperCase() === dealerName) {
                    dealerId = player.id;
                }
                // Find the corresponding player in the Cribbage game in order to find their hand
                const gamePlayer = game.players.findPlayer(player.name);
                chhs.push({
                    playerId: player.id,
                    gameHistoryId,
                    hand: gamePlayer.hand.toShortString(),
                    cut: game.cut.shortString()
                });
            }
            // Add the kitty
            chhs.push({
                playerId: dealerId,
                gameHistoryId,
                hand: game.kitty.toShortString(),
                cut: game.cut.shortString(),
                isCrib: true
            });
            try {
                await CribbageHandHistory.bulkCreate(chhs);
            }
            catch (e) {
                console.log(`error saving cribbage hand history for game ${gameHistoryId}`, e);
            }
        }

        /**
         * Record the winners and losers in the database, send a response to the channel if something fails
         * @note this method always resolves
         * @param req
         * @param gameHistoryId
         * @param game
         * @param players
         */
        private static async recordResult(req: Request, gameHistoryId: number, game: Cribbage, players: Array<Player>) {
            const histories = [];
            console.log(`Recording win-loss history for ${gameHistoryId}`);
            for (const player of players) {
                histories.push({
                    playerId: player.id,
                    gameHistoryId,
                    won: game.wonGame(player.name)
                });
            }
            try {
                await WinLossHistory.bulkCreate(histories);
                // Success!
                console.log(`Successfully recorded win-loss history for game ${gameHistoryId}`);
            }
            catch (e) {
                const message = `error creating win/loss history records for game ${gameHistoryId}`;
                console.log(message, e);
                Router.sendDelayedResponse(
                    Router.makeErrorResponse(message, SlackResponseType.in_channel).data,
                    Router.getResponseUrl(req)
                );
            }
        }

        /**
         * Acknowledge the request by sending an empty response
         * @param res
         */
        private static acknowledgeRequest(res: Response): void {
            Router.sendResponse(Router.makeResponse(), res);
        }

        /**
         * NOTE:
         * A new Game should be created by playerIDs joining the game via 'joinGame',
         * then calling 'beginGame' when all have joined
         */

        /* ***** ROUTES ***** */

        /* ***** Getting unfinished games ***** */

        async getUnfinishedGames(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.unfinishedGames)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            try {
                Router.acknowledgeRequest(res);
                const player = Router.getPlayerName(req);
                const override = Router.getRequestText(req);
                const playerToUse = ((override.length > 0) ? override : player);
                const ugResult = await this.cribbageService.getUnfinishedGames(playerToUse);
                if (ugResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(
                        Router.makeErrorResponse(ugResult.message).data,
                        resUrl
                    );
                }
                else {
                    const ghids = ugResult.gameHistoryIDs;
                    Router.sendDelayedResponse(
                        Router.makeResponse(
                            200,
                            ((ghids.length > 0) ? ghids.join(', ') : `${playerToUse} has no unfinished games`)
                        ).data,
                        resUrl
                    );
                }
            }
            catch (e) {
                Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
            }
        }

        async getCurrentGame(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.currentGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            try {
                Router.acknowledgeRequest(res);
                const player = Router.getPlayerName(req);
                const gameID = await this.cribbageService.getCurrentGame(player);
                const resType = SlackResponseType.ephemeral;
                if (gameID < 0) {
                    Router.sendDelayedResponse(
                        new CribbageResponseData(resType, 'You haven\'t joined a game yet'),
                        resUrl
                    );
                }
                else if (gameID === 0) {
                    Router.sendDelayedResponse(
                        new CribbageResponseData(resType, 'You\'ve joined the new game that has not yet begun'),
                        resUrl
                    );
                }
                else {
                    Router.sendDelayedResponse(
                        new CribbageResponseData(resType, `You're currently in game ${gameID}`),
                        resUrl
                    );
                }
            }
            catch (e) {
                Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
            }
        }

        /* ***** Initializing the Game ***** */

        async joinGame(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.joinGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            try {
                Router.acknowledgeRequest(res);
                const player = Router.getPlayerName(req);
                const gameHistoryID = Router.getRequestInt(req);
                const joinGameResult = await this.cribbageService.joinGame(player, gameHistoryID);
                if (joinGameResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(
                        Router.makeErrorResponse(joinGameResult.message).data,
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
            }
            catch (e) {
                Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
            }
        }

        async beginGame(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.beginGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            try {
                Router.acknowledgeRequest(res);
                const beginResult = await this.cribbageService.beginGame(Router.getPlayerName(req));
                if (beginResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(
                        Router.makeErrorResponse(beginResult.message, SlackResponseType.in_channel).data,
                        Router.getResponseUrl(req)
                    );
                }
                else {
                    const ga = beginResult.gameAssociation;
                    const response = Router.makeResponse(200, CribbageStrings.MessageStrings.FMT_START_GAME, SlackResponseType.in_channel);
                    response.data.text = `${CribbageStrings.MessageStrings.FMT_START_GAME}${ga.game.dealer.name}'s crib.`;
                    response.data.attachments.push(
                        new CribbageResponseAttachment(`Players: ${ga.game.printPlayers()}`)
                    );
                    Router.sendDelayedResponse(response.data, resUrl);
                }
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

        resetGame(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.resetGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const secret = req.body.text;
            const result = this.cribbageService.resetGame(secret);
            if (result.status === ResponseCode.ok) {
                Router.sendResponse(
                    Router.makeResponse(200, CribbageStrings.MessageStrings.GAME_RESET, SlackResponseType.ephemeral),
                    res
                );
            }
            else {
                const response = Router.makeResponse(200, `The new game was reset by ${Router.getPlayerName(req)}`);
                Router.sendResponse(response, res);
            }
        }


        /* ***** Run of play ***** */

        async leaveGame(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.leaveGame)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            try {
                Router.acknowledgeRequest(res);
                const player = Router.getPlayerName(req);
                const leaveGameResult = await this.cribbageService.leaveGame(player);
                if (leaveGameResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(
                        Router.makeErrorResponse(leaveGameResult.message).data,
                        resUrl
                    );
                }
                else {
                    Router.sendDelayedResponse(
                        Router.makeResponse(
                            200,
                            leaveGameResult.message
                        ).data,
                        resUrl
                    );
                }
            }
            catch (e) {
                Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
            }
        }

        describe(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.describe)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                const result = this.cribbageService.describe(Router.getRequestInt(req));
                Router.sendResponse(Router.makeResponse(200, result.message), res);
            }
        }

        async showHand(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.showHand)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            try {
                // Acknowledge the request
                Router.sendResponse(Router.makeResponse(200, 'creating your hand\'s image...'), res);
                const player = Router.getPlayerName(req);
                const playerHandResult = await this.cribbageService.getPlayerHand(player);
                if (playerHandResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(playerHandResult.message).data, resUrl);
                }
                else {
                    const hand: CribbageHand = playerHandResult.hand;
                    if (hand.size() === 0) {
                        Router.sendDelayedResponse(Router.makeResponse(200, 'You played all your cards!').data, resUrl);
                    }
                    else {
                        try {
                            const handUrl = await Router.IMAGE_MANAGER.getLatestPlayerHand(player, hand);
                            console.log(`adding attachment with url ${handUrl}`);
                            const resData = new CribbageResponseData(
                                SlackResponseType.ephemeral,
                                '',
                                [new CribbageResponseAttachment(`${Router.PLAYER_HAND_EMOJI}`, '', handUrl)]
                            );
                            Router.sendDelayedResponse(resData, resUrl);
                        }
                        catch (err) {
                            Router.sendDelayedResponse(
                                Router.makeErrorResponse(err).data,
                                resUrl
                            );
                        }
                    }
                }
            }
            catch (e) {
                Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
            }
        }

        async playCard(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.playCard)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
                return;
            }
            const resUrl = Router.getResponseUrl(req);
            const player = Router.getPlayerName(req);
            let card: Card = null;
            let cribRes: CribbageReturn = null;
            let playerGame: Cribbage = null;
            try {
                Router.acknowledgeRequest(res);
                const cards: Array<Card> = Router.parseCards(req.body.text);
                if (cards.length === 0) {
                    throw CribbageStrings.ErrorStrings.INVALID_CARD_SYNTAX;
                }
                else if (cards.length > 1) {
                    throw CribbageStrings.ErrorStrings.TOO_MANY_CARDS;
                }
                card = cards[0];
                if (card === undefined || card.suit === undefined || card.value === undefined) {
                    throw 'Parsing the card failed without throwing, so I\'m doing it now!';
                }
                const playCardResult = await this.cribbageService.playCard(player, card);
                if (playCardResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(playCardResult.message).data, resUrl);
                }
                else {
                    cribRes = playCardResult.cribRes;
                    playerGame = playCardResult.game;
                    if (cribRes.gameOver) {
                        Router.sendDelayedResponse(
                            Router.makeResponse(200, cribRes.message, SlackResponseType.in_channel).data,
                            resUrl
                        );
                        Router.resetSequenceImages();
                        // Record the wins/losses in the database
                        const ghid = playCardResult.gameHistoryID;
                        const players = await GameHistoryPlayerActions.getGamePlayers(ghid);
                        await Router.checkPlayersResult(players, ghid, async() => {
                            await Router.recordResult(req, ghid, playCardResult.game, players);
                        });
                    }
                    else if (cribRes.roundOver) {
                        // The round is over, use the responseText string
                        const playerGameResult = await this.cribbageService.getPlayerGame(player);
                        if (playerGameResult.status !== ResponseCode.ok) {
                            Router.sendDelayedResponse(
                                Router.makeErrorResponse(playerGameResult.message).data,
                                Router.getResponseUrl(req)
                            );
                        }
                        else {
                            Router.roundOverResetImages(playerGame);
                        }
                    }
                    else {
                        Router.resetSequenceImages();
                        // Tell the player what cards they have
                        const theirHand: CribbageHand = playerGame.getPlayerHand(Router.getPlayerName(req));
                        const hasHand = (theirHand.size() > 0);
                        const delayedData = new CribbageResponseData(SlackResponseType.ephemeral);
                        if (!hasHand) {
                            delayedData.text = 'You have no more cards!';
                        }
                        else {
                            const handUrl = await Router.IMAGE_MANAGER.createPlayerHandImageAsync(player, theirHand);
                            delayedData.attachments = [
                                new CribbageResponseAttachment(
                                    `${Router.PLAYER_HAND_EMOJI}  ${player}, your remaining cards are:`,
                                    '',
                                    handUrl
                                )
                            ];
                            Router.sendDelayedResponse(
                                delayedData,
                                resUrl,
                                2000
                            );
                        }
                    }
                }
            }
            catch (e) {
                Router.sendDelayedResponse(
                    Router.makeErrorResponse(`Error! ${e}! Current player: ${playerGame.nextPlayerInSequence.name}`).data,
                    resUrl
                );
            }
        }

        async throwCard(req: Request, res: Response) {
            const resUrl = Router.getResponseUrl(req);
            if (!Router.verifyRequest(req, Routes.throwCard)) {
                Router.sendDelayedResponse(Router.VALIDATION_FAILED_RESPONSE.data, resUrl);
                return;
            }
            const player = Router.getPlayerName(req);
            try {
                Router.acknowledgeRequest(res);
                const cards: Array<Card> = Router.parseCards(req.body.text);
                const giveToKittyResult = await this.cribbageService.giveToKitty(player, cards);
                if (giveToKittyResult.status !== ResponseCode.ok) {
                    Router.sendDelayedResponse(
                        Router.makeErrorResponse(giveToKittyResult.message).data,
                        Router.getResponseUrl(req)
                    );
                }
                else {
                    const cribRes = giveToKittyResult.cribRes;
                    const currentGame = giveToKittyResult.game;
                    const gameHistoryID = giveToKittyResult.gameHistoryID;
                    if (cribRes.gameOver) {
                        Router.sendDelayedResponse(
                            Router.makeResponse(200, cribRes.message, SlackResponseType.in_channel).data,
                            resUrl
                        );
                        Router.roundOverResetImages(currentGame);
                        // Record the wins/losses in the database
                        const players = await this.cribbageService.getGamePlayers(giveToKittyResult.gameHistoryID);
                        await Router.checkPlayersResult(players, gameHistoryID, async() => {
                            await Router.recordResult(req, gameHistoryID, currentGame, players);
                        });
                    }
                    else {
                        // Tell the channel the player threw to the crib
                        Router.sendDelayedResponse(
                            new CribbageResponseData(
                                SlackResponseType.in_channel,
                                `${player} threw to the kitty`
                            ),
                            resUrl
                        );
                        // Show the player the card they just played
                        const discardHandUrl = await Router.IMAGE_MANAGER.createDiscardImageAsync(player, cards);
                        console.log(`throwCard: returning the player's thrown cards at ${discardHandUrl}`);
                        Router.sendDelayedResponse(
                            new CribbageResponseData(
                                SlackResponseType.ephemeral,
                                '',
                                [new CribbageResponseAttachment('The cards you threw:', '', discardHandUrl)]
                            ),
                            resUrl,
                            500
                        );
                        // Show the rest of their hand
                        const theirHand = currentGame.getPlayerHand(player);
                        if (theirHand.size() > 0) {
                            const handUrl = await Router.IMAGE_MANAGER.createPlayerHandImageAsync(player, theirHand);
                            console.log(`throwCard: return player hand at ${handUrl}`);
                            Router.sendDelayedResponse(
                                new CribbageResponseData(
                                    SlackResponseType.ephemeral,
                                    '',
                                    [new CribbageResponseAttachment(`${Router.PLAYER_HAND_EMOJI}  Your remaining Cards:`, '', handUrl)]
                                ),
                                resUrl,
                                1000
                            );
                        }
                        else {
                            Router.sendDelayedResponse(Router.makeResponse(200, 'You have no more cards left').data, resUrl);
                        }
                        // Check if the game's ready to begin
                        if (currentGame.isReady()) {
                            const players = await this.cribbageService.getGamePlayers(gameHistoryID);
                            // Record each player's hand plus the kitty in the database
                            await Router.checkPlayersResult(players, gameHistoryID, async() => {
                                try {
                                    await Router.recordCribbageHands(gameHistoryID, currentGame, players);
                                }
                                catch (error) {
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
                                        '',
                                        [new CribbageResponseAttachment(
                                            text,
                                            '',
                                            ImageManager.getCardImageUrl(currentGame.cut)
                                        )]
                                    ),
                                    resUrl,
                                    2000
                                );
                            });
                        }
                    }
                }
            }
            catch (e) {
                Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
            }
        }

        async go(req: Request, res: Response) {
            if (!Router.verifyRequest(req, Routes.go)) {
                Router.sendResponse(Router.VALIDATION_FAILED_RESPONSE, res);
            }
            else {
                const resUrl = Router.getResponseUrl(req);
                try {
                    Router.acknowledgeRequest(res);
                    const player = Router.getPlayerName(req);
                    let gameHistoryID = 0, game = null;
                    const goResult = await this.cribbageService.go(player);
                    if (goResult.status !== ResponseCode.ok) {
                        Router.sendDelayedResponse(Router.makeErrorResponse(goResult.message).data, resUrl);
                    }
                    else {
                        const cribResponse = goResult.cribRes;
                        const currentGame = goResult.game;
                        if (cribResponse.gameOver) {
                            Router.roundOverResetImages(currentGame);
                            gameHistoryID = goResult.gameHistoryID;
                            game = goResult.game;
                            Router.sendDelayedResponse(new CribbageResponseData(SlackResponseType.in_channel, cribResponse.message), resUrl);
                            const players = await this.cribbageService.getGamePlayers(goResult.gameHistoryID);
                            // Record the wins/losses in the database
                            await Router.checkPlayersResult(players, gameHistoryID, async() => {
                                await Router.recordResult(req, gameHistoryID, game, players);
                            });
                        }
                        else {
                            if (currentGame.count === 0) {
                                Router.resetSequenceImages();
                            }
                            Router.sendDelayedResponse(
                                Router.makeResponse(200, `${player} says 'go'`, SlackResponseType.in_channel).data,
                                resUrl
                            );
                        }
                    }
                }
                catch (e) {
                    Router.sendDelayedResponse(Router.makeErrorResponse(e).data, resUrl);
                }
            }
        }

    }
}
