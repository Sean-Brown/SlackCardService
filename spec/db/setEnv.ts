import { config } from 'dotenv';

/**
 * Read the environment variables from a .env file located at spec/db/postgres/integration
 */
export function readConfigFromEnv() {
    config({path: './.env'});
}
