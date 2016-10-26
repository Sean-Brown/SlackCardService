/// <reference path="../../interfaces/iitem.ts" />

import {IItem} from "../../interfaces/iitem";

"use strict";

export enum Suit {
    Hearts, Spades, Diamonds, Clubs
}

export enum Value {
    Ace=1, Two, Three, Four, Five, Six, Seven,
    Eight, Nine, Ten, Jack, Queen, King
}

/* Credit to David Sherret
 * http://stackoverflow.com/questions/21293063/how-to-programmatically-enumerate-an-enum-type-in-typescript-0-9-5
 */
export class EnumExt {
    static getNames(e: any) {
        return Object.keys(e).filter(v => isNaN(parseInt(v, 10)));
    }
    static getValues<T extends number>(e: any) {
        return EnumExt.getObjValues(e).filter(v => typeof v === "number") as T[];
    }
    private static getObjValues(e: any): (number | string)[] {
        return Object.keys(e).map(k => e[k]);
    }
}

export class BaseCard implements IItem {
    suit: Suit;
    value: Value;
    constructor(suit: Suit, value: Value) {
        this.suit = suit;
        this.value = value;
    }
    equalsOther(card: BaseCard) {
        if (card == undefined || card == null)
            return false;
        return (this.suit == card.suit && this.value == card.value);
    }
    shortString():string {
        if (this.value > 1 && this.value < 10) {
            return `${this.value}${Suit[this.suit].substring(0,1)}`;
        }
        else {
            return `${Value[this.value].substring(0, 1)}${Suit[this.suit].substring(0, 1)}`;
        }
    }
    toString():string {
        return `${Value[this.value]} of ${Suit[this.suit]}`;
    }
    toUrlString(extension:string="png"):string {
        return `${Value[this.value]}Of${Suit[this.suit]}.${extension}`;
    }
}
