/// <reference path="../../../../typings/index.d.ts" />

import {PostgresTables} from "../../../../db/implementation/postgres/create_tables";
import {team_actions} from "../../../../db/implementation/postgres/team_actions";
import {readConfigFromEnv} from "./setEnv";
import {deleteTables} from "./CreateTablesSpec";
import {TeamReturn, DBReturnStatus, DBReturn} from "../../../../db/abstraction/return/db_return";
import {Team} from "../../../../db/abstraction/tables/team";
import {verifyReturn} from "../../../verifyReturn";
var Q = require("q");

// Create an entry in the team table
export const randomTeam = "randomTeam";

/**
 * Create a row for the team in the database
 * @returns the Team object for that row
 */
export function createTeam(): Q.Promise<Team> {
    return new Q.Promise((resolve, reject) => {
        team_actions.create(randomTeam)
            .then((ret: TeamReturn) => {
                verifyReturn(ret, "Expected a result from creating a team");
                resolve(ret.first());
            })
            .catch((ret: TeamReturn) => {
                expect(ret.first).toBeNull("Should have returned a null result");
                reject(null);
            });
    });
}
describe("Test the 'team' actions", function() {
    beforeEach(function(done) {
        readConfigFromEnv();
        PostgresTables.createTables().finally(() => { done(); });
    });
    afterEach(function(done) {
        // Drop the tables
        deleteTables().finally(() => { done(); });
    });
    it("can create a new team entry", function(done) {
        createTeam()
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find a created team entry", function(done) {
        createTeam()
            .then((result:Team) => {
                return team_actions.find(result.id);
            })
            .then((result:TeamReturn) => {
                verifyReturn(result, "Expected a result from finding a team");
                expect(result.first().name).toBe(randomTeam);
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    it("can find a created team by name", function(done) {
        createTeam()
            .then((result:Team) => {
                return team_actions.findByName(result.name);
            })
            .then((result:TeamReturn) => {
                verifyReturn(result, "Expected a result from finding a team by name");
                expect(result.first().name).toBe(randomTeam);
            })
            .catch(() => {
                // fail the test
                fail("Test should have succeeded");
            })
            .finally(() => { done(); });
    });
    // TODO test error cases
});
