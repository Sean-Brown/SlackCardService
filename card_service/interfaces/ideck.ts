import {BaseCard} from '../base_classes/items/card';

export interface DeckActions {
    shuffle(): void;
    draw(): BaseCard;
    randomDraw(withReplacement: boolean): BaseCard;
    toString(): string;
}
