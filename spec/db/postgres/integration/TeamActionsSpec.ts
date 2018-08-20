import * as expect from 'expect';
import Team from '../../../../db/models/team';
import { readConfigFromEnv } from '../../setEnv';
import { fail } from './helpers';
import truncate from './truncate';

// Create an entry in the team table
export const randomTeam = 'randomTeam';

/**
 * Create a row for the team in the database
 * @returns the Team object for that row
 */
export async function createTeam(): Promise<Team> {
    try {
        const ret = await Team.create({ name: randomTeam });
        return ret;
    }
    catch (e) {
        expect(e).toBeNull(`got error ${e}`);
        return null;
    }
}
describe('Test the \'team\' actions', function() {
    beforeEach(function() {
        readConfigFromEnv();
    });
    afterEach(async (done) => {
        // Drop the tables
        await truncate();
        done();
    });
    it('can create a new team entry', async function(done) {
        try {
            await createTeam();
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find a created team entry', async function(done) {
        try {
            const team = await createTeam();
            const result = await Team.findOne(team.id);
            expect(result.name).toBe(randomTeam);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
    it('can find a created team by name', async function(done) {
        try {
            const team = await createTeam();
            const result = await Team.findOne({
                where: {
                    name: team.name
                }
            });
            expect(result.name).toBe(randomTeam);
        }
        catch (e) {
            // fail the test
            fail(`Test should have succeeded. Error: ${e}`);
        }
        finally {
            done();
        }
    });
});
