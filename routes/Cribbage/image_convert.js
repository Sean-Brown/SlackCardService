var request = require("request");
var fs = require("fs");
var Promise = require("promise");
var images = require("images");
var ImageConvert;
(function (ImageConvert) {
    function getCardImageUrl(card, deckType) {
        if (deckType === void 0) { deckType = "Default"; }
        var cardUrlStr = card.toUrlString();
        return "" + process.env.AWS_S3_STANDARD_DECK_URL + deckType + "/" + cardUrlStr;
    }
    ImageConvert.getCardImageUrl = getCardImageUrl;
    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };
    function downloadCard(card, cardsPath) {
        return new Promise(function (resolve, reject) {
            var cardFilePath = "" + cardsPath + card.toUrlString();
            if (fs.exists(cardFilePath)) {
                resolve(cardFilePath);
            }
            else {
                download(getCardImageUrl(card), cardFilePath, function () {
                    resolve(cardFilePath);
                });
            }
        });
    }
    function makeHandImage(hand, player, cardsPath, sortCards) {
        if (sortCards === void 0) { sortCards = true; }
        console.log("Making the hand image at " + cardsPath);
        return new Promise(function (resolve, reject) {
            var playerHandPath = "";
            if (cardsPath.indexOf("/", cardsPath.length - 1) == -1)
                cardsPath = cardsPath.concat("/");
            if (!fs.existsSync(cardsPath)) {
                console.log("Creating directory " + cardsPath);
                fs.mkdirSync(cardsPath);
            }
            if (sortCards)
                hand.sortCards();
            var promises = [];
            console.log("downloading the cards");
            for (var ix = 0; ix < hand.size(); ix++) {
                promises.push(downloadCard(hand.itemAt(ix), cardsPath));
            }
            Promise.all(promises).then(function (values) {
                console.log("Finished downloading the cards, now create the final image");
                playerHandPath = "" + cardsPath + player + ".png";
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
                    playerHandImage.size(width, maxHeight).save(playerHandPath);
                }
                catch (e) {
                    reject(e);
                }
                resolve(playerHandPath);
            });
        });
    }
    ImageConvert.makeHandImage = makeHandImage;
})(ImageConvert = exports.ImageConvert || (exports.ImageConvert = {}));
//# sourceMappingURL=image_convert.js.map