import dotenv = require("dotenv");

/**
 * Read the environment variables from a .env
 * @param envPath the path to the .env file, defaults to "./.env"
 */
export function readConfigFromEnv(envPath:string="./.env") {
    dotenv.config({path: envPath});
}
