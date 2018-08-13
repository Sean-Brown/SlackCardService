import {BaseCard as Card} from '../base_classes/items/card';

export interface PlayerActions {
    playCard(card: Card): boolean;
}
