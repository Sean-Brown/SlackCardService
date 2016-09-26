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
    app.locals.cribbageRoutes = new CribbageRoutes.Router();
    // Respond to the base route with "Hello world"
    app.get("/", function(req: Request, res: Response) {
        res.status(200).send("Hello world!");
    });
    // Cribbage Routes
    app.get(CribbageRoutePrefix + CribbageRoutes.Routes.beginGame, app.locals.cribbageRoutes.beginGame.bind(app.locals.cribbageRoutes));
    app.get(CribbageRoutePrefix + CribbageRoutes.Routes.describe, app.locals.cribbageRoutes.describe.bind(app.locals.cribbageRoutes));
    app.get(CribbageRoutePrefix + CribbageRoutes.Routes.showHand, app.locals.cribbageRoutes.showHand.bind(app.locals.cribbageRoutes));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.go, app.locals.cribbageRoutes.go.bind(app.locals.cribbageRoutes));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.playCard, app.locals.cribbageRoutes.playCard.bind(app.locals.cribbageRoutes));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.joinGame, app.locals.cribbageRoutes.joinGame.bind(app.locals.cribbageRoutes));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.resetGame, app.locals.cribbageRoutes.resetGame.bind(app.locals.cribbageRoutes));
    app.post(CribbageRoutePrefix + CribbageRoutes.Routes.throwCard, app.locals.cribbageRoutes.throwCard.bind(app.locals.cribbageRoutes));
    // All other routes send back a "request not found"
    app.get("*", function(req: Request, res: Response) {
        res.status(404).send("Unknown request");
    });
    return app;
}

export var app = setup(express());
// start listening for incoming requests
export var server = app.listen(port, () => {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});


