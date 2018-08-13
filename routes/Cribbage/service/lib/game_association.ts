import {Cribbage} from '../../../../card_service/implementations/cribbage';

/**
 * Class associating a game and playerIDs
 */
export class GameAssociation {
    constructor(
        /**
         * The current game object
         */
        public game: Cribbage = null,
        /**
         * The game-history row ID
         */
        public gameHistoryID = 0,
        /**
         * The player row IDs
         */
        public playerIDs: Set<number> = new Set<number>(),
        /**
         * Association of a team ID to an array of playerIDs IDs
         */
        public teamPlayers: Map<number, Set<number>> = new Map<number, Set<number>>()
    ) {
    }
}
