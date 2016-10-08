export enum DBTables {
    CribbageHandHistory,
    Game,
    GameHistory,
    Player,
    WinLossHistory,
}
export function getTableName(table:DBTables):string {
    switch (table) {
        case DBTables.CribbageHandHistory:
            return "cribbage_hand_history";
        case DBTables.Game:
            return "game";
        case DBTables.GameHistory:
            return "game_history";
        case DBTables.Player:
            return "player";
        case DBTables.WinLossHistory:
            return "win_loss_history";
        default:
            throw `Unknown table ${table}`;
    }
}