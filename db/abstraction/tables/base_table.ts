export enum DBTables {
    CribbageHandHistory,
    Game,
    GameHistory,
    GameHistoryPlayer,
    HandHistory,
    Player,
    WinLossHistory
}
export function getTableName(table:DBTables):string {
    switch (table) {
        case DBTables.CribbageHandHistory:
            return "cribbage_hand_history";
        case DBTables.Game:
            return "game";
        case DBTables.GameHistory:
            return "game_history";
        case DBTables.GameHistoryPlayer:
            return "game_history_player_pivot";
        case DBTables.HandHistory:
            return "hand_history";
        case DBTables.Player:
            return "player";
        case DBTables.WinLossHistory:
            return "win_loss_history";
        default:
            throw `Unknown table ${table}`;
    }
}

export abstract class BaseTable {
    /**
     * The ID of this player in the database.
     * Primary key, auto-incrementing.
     */
    id:number;

    constructor(id:number) {
        this.id = id;
    }

    abstract getTable():DBTables;
}
