/// <reference path="typings/index.d.ts" />
/// <reference path="routes/Cribbage/index.ts" />

// Dependencies

import {Express, Request, Response} from "express";
import {CribbageRoutes} from "./routes/Cribbage/index";
var Q = require("q");

var bodyParser  = require("body-parser"),
    errorHandler= require("errorhandler"),
    express     = require("express"),
    port        = process.env.PORT || 5029;

export const CribbageRoutePrefix = "/cribbage";

export function setup(app: Express):Q.Promise<Express> {
    return new Q.Promise((resolve, reject) => {
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
        routes.init()
            .then(() => {
                app.locals.cribbageRoutes = routes;
                // Respond to the base route with "Hello world"
                app.get("/", function(req: Request, res: Response) {
                    res.status(200).send("Hello world!");
                });
                // Cribbage Routes
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.beginGame, routes.beginGame.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.describe, routes.describe.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.showHand, routes.showHand.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.go, routes.go.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.playCard, routes.playCard.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.joinGame, routes.joinGame.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.resetGame, routes.resetGame.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.throwCard, routes.throwCard.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.leaveGame, routes.leaveGame.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.unfinishedGames, routes.getUnfinishedGames.bind(routes));
                app.post(CribbageRoutePrefix + CribbageRoutes.Routes.currentGame, routes.getCurrentGame.bind(routes));
                // All other routes send back a "request not found"
                app.get("*", function(req: Request, res: Response) {
                    res.status(404).send("Unknown request");
                });
                resolve(app);
            })
            .catch(() => {
                reject(null);
            });
    });
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

setup(express())
    .then((app:Express) => {
        // start listening for incoming requests
        app.listen(port, () => {
            console.log("Express server listening on port %d in %s mode", port, app.settings.env);
        });
    })
    .catch(() => {
        console.log("Failed to create the express application");
    });


