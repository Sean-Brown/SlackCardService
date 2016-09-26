/// <reference path="typings/main.d.ts" />
/// <reference path="routes/Cribbage/index.ts" />

// Dependencies

import {Express, Request, Response} from "express";
import {CribbageRoutes} from "./routes/Cribbage/index";

var bodyParser  = require("body-parser"),
    errorHandler= require("errorhandler"),
    express     = require("express"),
    port        = process.env.PORT || 5029;

export var CribbageRoutePrefix = "/cribbage";

export function setup(app: Express):Express {
    // Configuration
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use("/public", express.static(__dirname + "/public"));
    app.use(express.static(__dirname + "/public"));

    var env = process.env.NODE_ENV || "development";
    if("development" == env.toLowerCase()) {
        app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    }
    else {
        app.use(errorHandler());
    }

    // Routes
    var routes = new CribbageRoutes.Router();
    // Respond to the base route with "Hello world"
    app.get("/", function(req: Request, res: Response) {
        res.status(200).send("Hello world!");
    });
    // Cribbage Routes
    app.get(CribbageRoutePrefix + CribbageRoutes.Routes.beginGame, routes.beginGame.bind(app));
    app.get(CribbageRoutePrefix + CribbageRoutes.Routes.describe, routes.describe.bind(app));
    app.get(CribbageRoutePrefix + CribbageRoutes.Routes.showHand, routes.showHand.bind(app));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.go, routes.go.bind(routes));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.playCard, routes.playCard.bind(app));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.joinGame, routes.joinGame.bind(app));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.resetGame, routes.resetGame.bind(app));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.throwCard, routes.throwCard.bind(app));
    // All other routes send back a "request not found"
    app.get("*", function(req: Request, res: Response) {
        res.status(404).send("Unknown request");
    });
    app.locals.cribbageRoutes = routes;
    return app;
}

export var app = setup(express());
// start listening for incoming requests
export var server = app.listen(port, () => {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});


