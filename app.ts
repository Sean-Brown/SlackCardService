import * as bodyParser from 'body-parser';
import * as errorHandler from 'errorhandler';
import * as express from 'express';
import {CribbageRoutes} from './routes/Cribbage';
const port = process.env.PORT || 5029;

export const CribbageRoutePrefix = '/cribbage';

export async function setup(app: express.Express): Promise<express.Application> {
    // Configuration
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use('/public', express.static(__dirname + '/public'));
    app.use(express.static(__dirname + '/public'));

    const env = process.env.NODE_ENV || 'development';
    if ('development' === env.toLowerCase()) {
        app.use(errorHandler({log: true}));
    }
    else {
        app.use(errorHandler());
    }

    // Routes
    const routes = new CribbageRoutes.Router();
    try {
        await routes.init();
        app.locals.cribbageRoutes = routes;
        // Respond to the base route with 'Hello world'
        app.get('/', function (req: express.Request, res: express.Response) {
            res.status(200).send('Hello world!');
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
        // All other routes send back a 'request not found'
        app.get('*', function (req: express.Request, res: express.Response) {
            res.status(404).send('Unknown request');
        });
        return app;
    }
    catch (e) {
        console.error(e);
        return null;
    }
}

// TODO use iffy?
setup(express())
    .then((app: express.Application) => {
        // start listening for incoming requests
        app.listen(port, () => {
            console.log('Express server listening on port %d in %s mode', port, app.settings.env);
        });
    })
    .catch(() => {
        console.log('Failed to create the express application');
    });


