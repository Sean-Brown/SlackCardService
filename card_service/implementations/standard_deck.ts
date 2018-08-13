import {BaseDeck} from '../base_classes/collections/deck';
import {BaseCard, EnumExt, Suit, Value} from '../base_classes/items/card';

export class StandardDeck extends BaseDeck<BaseCard> {
    constructor() {
        // Create the 52-card deck
        const cards = [];
        const suitNames = EnumExt.getNames(Suit);
        const cardNames = EnumExt.getNames(Value);
        for (let ixSuit = 0; ixSuit < suitNames.length; ixSuit++) {
            // Start ixVal at 1 to adjust for the enum being 1-based
            for (let ixVal = 1; ixVal < cardNames.length + 1; ixVal++) {
                cards.push(new BaseCard(ixSuit, ixVal));
            }
        }
        super(cards);
    }
}
