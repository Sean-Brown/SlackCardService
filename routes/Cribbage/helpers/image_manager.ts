/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../../../card_service/interfaces/iitem" />
/// <reference path="../../../card_service/base_classes/collections/item_collection" />
/// <reference path="../../../card_service/implementations/cribbage.ts" />
/// <reference path="../../../card_service/implementations/cribbage_hand.ts" />
/// <reference path="../../../card_service/implementations/cribbage_player.ts" />
/// <reference path="../../../card_service/base_classes/card_game.ts" />

import request = require("request");
import fs = require("fs");
import Promise = require("promise");
//if (process.env.NODE_ENV != "Production")
//require('promise/lib/rejection-tracking').enable();
import images = require("images");
import {IItem} from "../../../card_service/interfaces/iitem";
import {CribbageHand} from "../../../card_service/implementations/cribbage_hand";
import {BaseCard as Card} from "../../../card_service/base_classes/items/card";
import {ItemCollection} from "../../../card_service/base_classes/collections/item_collection";
import {Sequence} from "../../../card_service/base_classes/card_game";
import {sep} from "path";
import {CribbagePlayer} from "../../../card_service/implementations/cribbage_player";


function mkdirSync(path:string):void {
    var dirs = path.split(sep);
    var root = "";
    while (dirs.length > 0) {
        var dir = dirs.shift();
        if (dir == "") {
            // If directory starts with a /, the first path will be an empty string.
            root = sep;
        }
        if (!fs.existsSync(root + dir)) {
            fs.mkdirSync(root + dir);
        }
        root += dir + sep;
    }
}

function endWithSlash(str:string):string {
    if (str.indexOf("/", str.length - 1) == -1)
        return str.concat("/");
    else
        return str;
}

module ImageConvert {
    var cardsPath = process.env.TMP_CARDS_PATH || "public/cards/";
    cardsPath = endWithSlash(cardsPath);

    export function makeLocalUrlPath(imagePath:string):string {
        var path = `${process.env.APP_HOST_URL}/${imagePath}`;
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
    export function getCardImageUrl(card:Card, deckType:string="Default"): string {
        var cardUrlStr = card.toUrlString(), cardFilePath = `${cardsPath}${cardUrlStr}`;
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

    var download = function(uri:string, filename:string, callback:any){
        request.head(uri, function(err, res, body){
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    function downloadCard(card:Card): Promise<string> {
        return new Promise<string>(function(resolve, reject) {
            var cardFilePath = `${cardsPath}${card.toUrlString()}`;
            if (fs.existsSync(cardFilePath)) {
                console.log(`getting the ${card.toString()} from cache`);
                // Resolve right away, no need to download again
                resolve(cardFilePath);
            }
            else {
                console.log(`About to download the ${card.toString()}`);
                // Download the card
                download(getCardImageUrl(card), cardFilePath, function () {
                    resolve(cardFilePath);
                });
            }
        });
    }

    function generateUniqueName(player:string, type:PlayerImageType):string {
        var date = new Date();
        var year = date.getFullYear(),
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
    export function makeHandImageAsync(player:string, hand:CribbageHand, type:PlayerImageType, imagesPath:string, sortCards:boolean=true):Promise<string> {
        console.log(`Making the hand image at ${imagesPath}`);
        return new Promise(function(resolve, reject) {
            var playerHandPath = "";
            imagesPath = endWithSlash(imagesPath);
            if (!fs.existsSync(imagesPath)) {
                console.log(`Creating directory ${imagesPath}`);
                mkdirSync(imagesPath);
            }
            if (sortCards)
                hand.sortCards();
            var promises:Array<Promise<string>> = [];
            console.log("downloading the cards");
            for (var ix = 0; ix < hand.size(); ix++) {
                // Download all the cards asynchronously
                promises.push(downloadCard(hand.itemAt(ix)));
            }
            Promise.all(promises).then(function (values) {
                console.log("Finished downloading the cards, now create the final image");
                // Merge together all the downloaded images
                playerHandPath = `${imagesPath}${generateUniqueName(player, type)}.png`;
                var width = 0, maxHeight = 0;
                for (var jx = 0; jx < values.length; jx++) {
                    var cardFilePath = values[jx];
                    width += images(cardFilePath).width();
                    var height = images(cardFilePath).height();
                    if (height > maxHeight) {
                        maxHeight = height;
                    }
                }
                var playerHandImage = images(width, maxHeight);
                var xOffset = 0;
                width = 0;
                for (var kx = 0; kx < values.length; kx++) {
                    var filePath = values[kx];
                    width += images(filePath).width();
                    playerHandImage = playerHandImage.draw(images(filePath), xOffset, 0);
                    xOffset = width;
                }
                console.log("Creating the final image...");
                try {
                    playerHandImage.save(playerHandPath);
                }
                catch (e) {
                    reject(e);
                }
                resolve(playerHandPath);
            });
        });
    }
}

enum PlayerImageType {
    discard,
    hand,
    sequence
}

class PlayerImage implements IItem {
    constructor(public path:string, public type:PlayerImageType) {
    }
    equalsOther(other:PlayerImage):boolean {
        return (this.path == other.path);
    }
}

class Stack<T extends IItem> extends ItemCollection<T> {
    push(t:T) {
        this.items.unshift(t);
    }
    pop():T {
        return this.items.shift();
    }
}

class PlayerImages implements IItem {
    constructor(public player:string, protected images:Stack<PlayerImage>) {
    }
    /**
     * Add the image to the head of the list
     * @param {string} imageUrl the url of the image
     * @param {PlayerImageType} type the type of image
     */
    pushImage(imagePath:string, type:PlayerImageType): void {
        this.images.push(new PlayerImage(imagePath, type));
    }
    getLatestImage(): string {
        return (this.imageCount() > 0 ? this.images.itemAt(0).path : "");
    }
    imageCount(): number {
        return this.images.countItems();
    }
    clearAll():void {
        // Delete all the image files
        for (var ix = 0; ix < this.images.countItems(); ix++) {
            var playerImage = this.images.itemAt(ix);
            if (fs.existsSync(playerImage.path)) {
                fs.unlinkSync(playerImage.path);
            }
        }
        // Clear the array
        this.images.removeAll();
    }
    equalsOther(other:PlayerImages): boolean {
        return (this.player == other.player);
    }
}

export class ImageManager {
    static HANDS_PATH:string = process.env.TMP_HANDS_PATH || "public/hands";
    static SEQUENCE_NAME:string = "sequence";
    constructor(protected playerImages:ItemCollection<PlayerImages>=null) {
        this.playerImages = new ItemCollection<PlayerImages>([]);
        if (!fs.existsSync(ImageManager.HANDS_PATH)) {
            mkdirSync(ImageManager.HANDS_PATH);
        }
    }

    private findPlayerImage(player:string):PlayerImages {
        var playerImage:PlayerImages = null;
        for (var ix = 0; ix < this.playerImages.countItems(); ix++) {
            var tmp = this.playerImages.itemAt(ix);
            if (tmp.player == player) {
                playerImage = tmp;
                break;
            }
        }
        return playerImage;
    }

    static getCardImageUrl(card:Card):string {
        return ImageConvert.getCardImageUrl(card);
    }

    /**
     * Get the image URL for the given player's latest hand
     * @param {string} player the name of the player
     * @param {CribbageHand} hand the hand to create an image for if the player does not have a latest hand
     * @returns the path to the image of the player's latest hand
     */
    getLatestPlayerHand(player:string, hand:CribbageHand):Promise<string> {
        var that = this;
        return new Promise(function(resolve, reject) {
            var playerImage = that.findPlayerImage(player);
            if (playerImage != null && playerImage.imageCount() > 0) {
                // Resolve on the cached image
                resolve(ImageConvert.makeLocalUrlPath(playerImage.getLatestImage()));
            }
            else {
                // Create a new image and resolve on that
                that.createPlayerHandImageAsync(player, hand)
                    .done(function(handUrl:string){
                        resolve(handUrl);
                    });
            }
        });
    }

    /**
     * Get the path to the last sequence image
     */
    getLatestSequence(sequence:Sequence):Promise<string> {
        return this.getLatestPlayerHand(ImageManager.SEQUENCE_NAME, new CribbageHand(sequence.cards.items));
    }

    private createHandImageAsync(player:string, hand:CribbageHand, type:PlayerImageType, sortHand:boolean):Promise<string> {
        var that = this;
        return new Promise(function(resolve, reject) {
            ImageConvert.makeHandImageAsync(player, hand, type, ImageManager.HANDS_PATH, sortHand)
                .then(function(handPath:string) {
                    // Add the hand's image to the player's collection of hand images
                    var playerImages = that.findPlayerImage(player);
                    if (playerImages == null) {
                        playerImages = new PlayerImages(player, new Stack([]));
                    }
                    playerImages.pushImage(handPath, type);
                    that.playerImages.addItem(playerImages);
                    resolve(ImageConvert.makeLocalUrlPath(handPath));
                });
        });
    }

    clearHands(players:Array<CribbagePlayer>):void {
        for (var ix = 0; ix < players.length; ix++) {
            var playerImages = this.findPlayerImage(players[ix].name);
            if (playerImages != null) {
                playerImages.clearAll();
            }
        }
    }

    clearSequence():void {
        var sequenceImage = this.findPlayerImage(ImageManager.SEQUENCE_NAME);
        if (sequenceImage != null) {
            sequenceImage.clearAll();
        }
    }

    clearAllImages():void {
        for (var ix = 0; ix < this.playerImages.countItems(); ix++) {
            this.playerImages.itemAt(ix).clearAll();
        }
    }

    createDiscardImageAsync(player:string, discards:Array<Card>) {
        return this.createHandImageAsync(player, new CribbageHand(discards), PlayerImageType.discard, true);
    }

    createSequenceImageAsync(sequence:Sequence):Promise<string> {
        return this.createHandImageAsync(ImageManager.SEQUENCE_NAME, new CribbageHand(sequence.cards.items), PlayerImageType.sequence, false);
    }

    createPlayerHandImageAsync(player:string, hand:CribbageHand):Promise<string> {
        return this.createHandImageAsync(player, hand, PlayerImageType.hand, true);
    }
}
