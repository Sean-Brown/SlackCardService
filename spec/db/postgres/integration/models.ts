import { CribbageHandHistory } from '../../../../db/models/cribbage_hand_history';
import { Game } from '../../../../db/models/game';
import { GameHistory } from '../../../../db/models/game_history';
import { GameHistoryPlayer } from '../../../../db/models/game_history_player';
import { Player } from '../../../../db/models/player';
import { Team } from '../../../../db/models/team';
import { WinLossHistory } from '../../../../db/models/win_loss_history';

export const models = [CribbageHandHistory, Game, GameHistory, GameHistoryPlayer, Player, Team, WinLossHistory];
