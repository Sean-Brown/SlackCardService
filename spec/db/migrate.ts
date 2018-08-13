import { process as proc } from 'core-worker';
import { readConfigFromEnv } from './setEnv';

(async () => {
    // Read the DB connection string out of the environment file
    readConfigFromEnv();
    // Our database URL
    const url = process.env.DB_CONNECTION_STRING;
    try {
        // Migrate the DB
        await proc(`./node_modules/.bin/sequelize db:migrate --url=${url}`).death();
        console.log('*************************');
        console.log('Migration successful');
    }
    catch (err) {
        console.log('*************************');
        console.log('Migration failed. Error:', err.message);
        process.exit(1);
    }
    process.exit(0);
})();
