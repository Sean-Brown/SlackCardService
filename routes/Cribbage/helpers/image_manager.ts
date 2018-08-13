import * as fs  from 'fs';
import * as images from 'images';
import {sep} from 'path';
import * as request from 'request';
import {Sequence} from '../../../card_service/base_classes/card_game';
import {ItemCollection} from '../../../card_service/base_classes/collections/item_collection';
import {BaseCard as Card} from '../../../card_service/base_classes/items/card';
import {CribbageHand} from '../../../card_service/implementations/cribbage_hand';
import {CribbagePlayer} from '../../../card_service/implementations/cribbage_player';
import {IItem} from '../../../card_service/interfaces/iitem';

function mkdirSync(path: string): void {
    const dirs = path.split(sep);
    let root = '';
    while (dirs.length > 0) {
        const dir = dirs.shift();
        if (dir === '') {
            // If directory starts with a /, the first path will be an empty string.
            root = sep;
        }
        if (!fs.existsSync(root + dir)) {
            fs.mkdirSync(root + dir);
        }
        root += dir + sep;
    }
}

function endWithSlash(str: string): string {
    if (str.indexOf('/', str.length - 1) === -1) {
        return str.concat('/');
    }
    else {
        return str;
    }
}

namespace ImageConvert {
    let cardsPath = process.env.TMP_CARDS_PATH || 'public/cards/';
    cardsPath = endWithSlash(cardsPath);

    export function makeLocalUrlPath(imagePath: string): string {
        const path = `${process.env.APP_HOST_URL}/${imagePath}`;
        console.log(`returning local url path ${path}`);
        return path;
    }

    /**
     * Get a url to the card's image. The image either exists locally (in which case return
     * the url string for the local card
     * @param card
     * @param deckType
     * @returns {*}
     */
    export function getCardImageUrl(card: Card, deckType = 'Default'): string {
        const cardUrlStr = card.toUrlString();
        let cardFilePath = `${cardsPath}${cardUrlStr}`;
        if (fs.existsSync(cardFilePath)) {
            // Give the url to the card on the heroku server
            cardFilePath = makeLocalUrlPath(cardFilePath);
        }
        else {
            // Give the S3 url
            cardFilePath = `${process.env.AWS_S3_STANDARD_DECK_URL}${deckType}/${cardUrlStr}`;
        }
        return cardFilePath;
    }

    const download = function (uri: string, filename: string, successCallback: any, failureCallback: any) {
        request.head(uri, function (err, res, body) {
            if (err) {
                console.error(`Error downloading ${filename} from ${uri}: ${err}`);
                failureCallback(err);
            }
            else {
                request(uri).pipe(fs.createWriteStream(filename)).on('close', successCallback);
            }
        });
    };

    function downloadCard(card: Card): Promise<string> {
        return new Promise((resolve, reject) => {
            const cardFilePath = `${cardsPath}${card.toUrlString()}`;
            if (fs.existsSync(cardFilePath)) {
                console.log(`getting the ${card.toString()} from cache`);
                // Resolve right away, no need to download again
                resolve(cardFilePath);
            }
            else {
                console.log(`About to download the ${card.toString()}`);
                // Download the card
                download(
                    getCardImageUrl(card),
                    cardFilePath,
                    function () {
                        resolve(cardFilePath);
                    },
                    function (err: string) {
                        reject(err);
                    }
                );
            }
        });
    }

    function generateUniqueName(player: string, type: PlayerImageType): string {
        const date = new Date();
        const year = date.getFullYear(),
            month = date.getMonth(),
            day = date.getDay(),
            hour = date.getHours(),
            minute = date.getMinutes(),
            second = date.getSeconds(),
            millisecond = date.getMilliseconds();
        return `${player}-${type}-${year}${month}${day}-${hour}${minute}${second}${millisecond}`;
    }

    /***
     * @param player
     * @param hand
     * @param type
     * @param imagesPath
     * @param sortCards
     * @returns {string} the local path to the image
     */
    export async function makeHandImageAsync(player: string, hand: CribbageHand, type: PlayerImageType, imagesPath: string, sortCards = true): Promise<string> {
        console.log(`Making the hand image at ${imagesPath}`);
        let playerHandPath = '';
        imagesPath = endWithSlash(imagesPath);
        if (!fs.existsSync(imagesPath)) {
            console.log(`Creating directory ${imagesPath}`);
            mkdirSync(imagesPath);
        }
        if (sortCards) {
            hand.sortCards();
        }
        const promises: Array<Promise<string>> = [];
        console.log('downloading the cards');
        for (let ix = 0; ix < hand.size(); ix++) {
            // Download all the cards asynchronously
            promises.push(downloadCard(hand.itemAt(ix)));
        }
        try {
            const values = await Promise.all(promises);
            console.log('Finished downloading the cards, now create the final image');
            // Merge together all the downloaded images
            playerHandPath = `${imagesPath}${generateUniqueName(player, type)}.png`;
            let width = 0, maxHeight = 0;
            for (let jx = 0; jx < values.length; jx++) {
                const cardFilePath = values[jx];
                width += images(cardFilePath).width();
                const height = images(cardFilePath).height();
                if (height > maxHeight) {
                    maxHeight = height;
                }
            }
            let playerHandImage = images(width, maxHeight);
            let xOffset = 0;
            width = 0;
            for (let kx = 0; kx < values.length; kx++) {
                const filePath = values[kx];
                width += images(filePath).width();
                playerHandImage = playerHandImage.draw(images(filePath), xOffset, 0);
                xOffset = width;
            }
            console.log('Creating the final image...');
            try {
                playerHandImage.save(playerHandPath);
            }
            catch (e) {
                return e;
            }
            return playerHandPath;
        }
        catch (err) {
            console.error(`Promise.all() rejected with ${err}`);
            return err;
        }
    }
}

enum PlayerImageType {
    discard,
    hand,
    sequence
}

class PlayerImage implements IItem {
    constructor(public path: string, public type: PlayerImageType) {
    }

    equalsOther(other: PlayerImage): boolean {
        return (this.path === other.path);
    }
}

class Stack<T extends IItem> extends ItemCollection<T> {
    push(t: T) {
        this.items.unshift(t);
    }

    pop(): T {
        return this.items.shift();
    }
}

class PlayerImages implements IItem {
    constructor(public player: string, protected images: Stack<PlayerImage>) {
    }

    /**
     * Add the image to the head of the list
     * @param {string} imagePath the local path to the image
     * @param {PlayerImageType} type the type of image
     */
    pushImage(imagePath: string, type: PlayerImageType): void {
        this.images.push(new PlayerImage(imagePath, type));
    }

    getLatestImage(): string {
        return (this.imageCount() > 0 ? this.images.itemAt(0).path : '');
    }

    imageCount(): number {
        return this.images.countItems();
    }

    clearAll(): void {
        // Delete all the image files -- delay this by a few seconds so clients
        // have time to download the image files
        const store = [];
        for (let ix = 0; ix < this.images.countItems(); ix++) {
            const playerImage = this.images.itemAt(ix);
            if (fs.existsSync(playerImage.path)) {
                store.push(playerImage.path);
                // fs.unlinkSync(playerImage.path);
            }
        }
        // Clear the array
        this.images.removeAll();
        // Remove the images after a time delay
        setTimeout(() => {
            for (let ix = 0; ix < store.length; ix++) {
                const image = store[ix];
                fs.unlinkSync(image);
            }
        }, 5000);
    }

    equalsOther(other: PlayerImages): boolean {
        return (this.player === other.player);
    }
}

export class ImageManager {
    static HANDS_PATH: string = process.env.TMP_HANDS_PATH || 'public/hands';
    static readonly SEQUENCE_NAME = 'sequence';

    constructor(protected playerImages: ItemCollection<PlayerImages> = null) {
        this.playerImages = new ItemCollection<PlayerImages>([]);
        if (!fs.existsSync(ImageManager.HANDS_PATH)) {
            mkdirSync(ImageManager.HANDS_PATH);
        }
    }

    private findPlayerImage(player: string): PlayerImages {
        let playerImage: PlayerImages = null;
        for (let ix = 0; ix < this.playerImages.countItems(); ix++) {
            const tmp = this.playerImages.itemAt(ix);
            if (tmp.player === player) {
                playerImage = tmp;
                break;
            }
        }
        return playerImage;
    }

    static getCardImageUrl(card: Card): string {
        return ImageConvert.getCardImageUrl(card);
    }

    /**
     * Get the image URL for the given player's latest hand
     * @param {string} player the name of the player
     * @param {CribbageHand} hand the hand to create an image for if the player does not have a latest hand
     * @returns the path to the image of the player's latest hand
     */
    async getLatestPlayerHand(player: string, hand: CribbageHand): Promise<string> {
        const playerImage = this.findPlayerImage(player);
        if (playerImage !== null && playerImage.imageCount() > 0) {
            // Resolve on the cached image
            return ImageConvert.makeLocalUrlPath(playerImage.getLatestImage());
        }
        else {
            // Create a new image and resolve on that
            try {
                return await this.createPlayerHandImageAsync(player, hand);
            }
            catch (err) {
                return err;
            }
        }
    }

    /**
     * Get the path to the last sequence image
     */
    async getLatestSequence(sequence: Sequence): Promise<string> {
        return this.getLatestPlayerHand(ImageManager.SEQUENCE_NAME, new CribbageHand(sequence.cards.items));
    }

    private async createHandImageAsync(player: string, hand: CribbageHand, type: PlayerImageType, sortHand: boolean): Promise<string> {
        try {
            const handPath = await ImageConvert.makeHandImageAsync(player, hand, type, ImageManager.HANDS_PATH, sortHand);
            // Add the hand's image to the player's collection of hand images
            let playerImages = this.findPlayerImage(player);
            if (playerImages === null) {
                playerImages = new PlayerImages(player, new Stack([]));
            }
            playerImages.pushImage(handPath, type);
            this.playerImages.addItem(playerImages);
            return ImageConvert.makeLocalUrlPath(handPath);
        }
        catch (err) {
            return err;
        }
    }

    clearHands(players: Array<CribbagePlayer>): void {
        for (let ix = 0; ix < players.length; ix++) {
            const playerImages = this.findPlayerImage(players[ix].name);
            if (playerImages !== null) {
                playerImages.clearAll();
            }
        }
    }

    clearSequence(): void {
        const sequenceImage = this.findPlayerImage(ImageManager.SEQUENCE_NAME);
        if (sequenceImage !== null) {
            sequenceImage.clearAll();
        }
    }

    clearAllImages(): void {
        for (let ix = 0; ix < this.playerImages.countItems(); ix++) {
            this.playerImages.itemAt(ix).clearAll();
        }
    }

    createDiscardImageAsync(player: string, discards: Array<Card>) {
        return this.createHandImageAsync(player, new CribbageHand(discards), PlayerImageType.discard, true);
    }

    async createSequenceImageAsync(sequence: Sequence): Promise<string> {
        return this.createHandImageAsync(ImageManager.SEQUENCE_NAME, new CribbageHand(sequence.cards.items), PlayerImageType.sequence, false);
    }

    async createPlayerHandImageAsync(player: string, hand: CribbageHand): Promise<string> {
        return this.createHandImageAsync(player, hand, PlayerImageType.hand, true);
    }
}
