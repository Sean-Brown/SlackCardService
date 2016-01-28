var index_1 = require("./routes/Cribbage/index");
var bodyParser = require("body-parser"), errorHandler = require("errorhandler"), express = require("express"), port = process.env.PORT || 5029;
exports.CribbageRoutePrefix = "/cribbage";
function setup(app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use("/public", express.static(__dirname + "/public"));
    app.use(express.static(__dirname + "/public"));
    var env = process.env.NODE_ENV || "development";
    if ("development" == env.toLowerCase()) {
        app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    }
    else {
        app.use(errorHandler());
    }
    var routes = new index_1.CribbageRoutes.Router();
    app.locals.cribbageRoutes = routes;
    app.get("/", function (req, res) {
        res.status(200).send("Hello world!");
    });
    app.get(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.beginGame, routes.beginGame);
    app.get(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.describe, routes.describe);
    app.get(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.showHand, routes.showHand);
    app.post(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.go, routes.go);
    app.post(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.playCard, routes.playCard);
    app.post(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.joinGame, routes.joinGame);
    app.post(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.resetGame, routes.resetGame);
    app.post(exports.CribbageRoutePrefix + index_1.CribbageRoutes.Routes.throwCard, routes.throwCard);
    app.get("*", function (req, res) {
        res.status(404).send("Unknown request");
    });
    return app;
}
exports.setup = setup;
exports.app = setup(express());
exports.server = exports.app.listen(port, function () {
    console.log("Express server listening on port %d in %s mode", port, exports.app.settings.env);
});
//# sourceMappingURL=app.js.map