/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../card_service/implementations/cribbage.ts" />
/// <reference path="../../card_service/implementations/cribbage_hand.ts" />
/// <reference path="../../card_service/implementations/cribbage_player.ts" />
/// <reference path="../../card_service/base_classes/card_game.ts" />

import request = require("request");
import fs = require("fs");
import Promise = require("promise");
//if (process.env.NODE_ENV != "Production")
//require('promise/lib/rejection-tracking').enable();
// SB TODO: write typescript definition file
import images = require("images");

import {CribbageHand} from "../../card_service/implementations/cribbage_hand";
import {BaseCard as Card} from "../../card_service/base_classes/items/card";


export module ImageConvert {
    export function getCardImageUrl(card:Card, deckType:string="Default"): string {
        var cardUrlStr = card.toUrlString();
        return `${process.env.AWS_S3_STANDARD_DECK_URL}${deckType}/${cardUrlStr}`;
    }

    var download = function(uri:string, filename:string, callback:any){
        request.head(uri, function(err, res, body){
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    function downloadCard(card:Card, cardsPath:string): Promise {
        return new Promise(function(resolve, reject) {
            var cardFilePath = `${cardsPath}${card.toUrlString()}`;
            if (fs.exists(cardFilePath)) {
                // Resolve right away, no need to download again
                resolve(cardFilePath);
            }
            else {
                // Download the card
                download(getCardImageUrl(card), cardFilePath, function () {
                    resolve(cardFilePath);
                });
            }
        });
    }

    export function makeHandImage(hand:CribbageHand, player:string, cardsPath:string, sortCards:boolean=true):Promise {
        console.log(`Making the hand image at ${cardsPath}`);
        return new Promise(function(resolve, reject) {
            var playerHandPath = "";
            if (cardsPath.indexOf("/", cardsPath.length - 1) == -1)
                cardsPath = cardsPath.concat("/");
            if (!fs.existsSync(cardsPath)) {
                console.log(`Creating directory ${cardsPath}`);
                fs.mkdirSync(cardsPath);
            }
            if (sortCards)
                hand.sortCards();
            var promises:Array<Promise> = [];
            console.log("downloading the cards");
            for (var ix = 0; ix < hand.size(); ix++) {
                // Download all the cards asynchronously
                promises.push(downloadCard(hand.itemAt(ix), cardsPath));
            }
            Promise.all(promises).then(function (values) {
                console.log("Finished downloading the cards, now create the final image");
                // Merge together all the downloaded images
                playerHandPath = `${cardsPath}${player}.png`;
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
                try { playerHandImage.size(width, maxHeight).save(playerHandPath); }
                catch (e) { reject(e); }
                resolve(playerHandPath);
            });
        });
    }
}
