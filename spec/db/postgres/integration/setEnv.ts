import dotenv = require("dotenv");

/**
 * Read the environment variables from a .env file located at spec/db/postgres/integration
 */
export function readConfigFromEnv() {
    dotenv.config({path: "./.env"});
}
