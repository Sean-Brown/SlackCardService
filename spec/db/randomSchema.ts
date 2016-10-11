/**
 * Create a random schema name to use -- this will prevent
 * tests from messing with each others' database
 * @returns random alpha-only string of length 32
 */
export function getRandomSchema(): string {
    var result = [];
    const length = 32;
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let ix = length; ix > 0; --ix) {
        result.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    return result.join("");
}