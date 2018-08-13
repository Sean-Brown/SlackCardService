import {IItem} from '../../interfaces/iitem';

export class ItemCollection<ItemType extends IItem> implements IItem {
    items: Array<ItemType>;

    constructor(items: Array<ItemType>) {
        this.items = items;
    }

    deepCopy(): ItemCollection<ItemType> {
        return new ItemCollection<ItemType>(this.items.slice(0));
    }

    indexOfItem(item: ItemType) {
        let index = -1;
        for (let ix = 0; ix < this.items.length; ix++) {
            if (item.equalsOther(this.items[ix])) {
                index = ix;
                break;
            }
        }
        return index;
    }

    countItems() {
        return this.items.length;
    }

    insertItem(item: ItemType, index: number) {
        this.items.splice(index, 0, item);
    }

    addItem(item: ItemType) {
        this.items.push(item);
    }

    addItems(items: Array<ItemType>) {
        this.items = this.items.concat(items);
    }

    removeItem(item: ItemType) {
        const index = this.indexOfItem(item);
        const hasItem = (index !== -1);
        if (hasItem) {
            this.items.splice(index, 1);
        }
        return hasItem;
    }

    removeAll() {
        this.items.splice(0, this.items.length);
    }

    itemAt(index: number) {
        if (index < 0 || index > this.items.length) {
            throw 'Index out of bounds!';
        }
        return this.items[index];
    }

    equalsOther(other: ItemCollection<ItemType>): boolean {
        let equals = true;
        for (let ix = 0; ix < this.items.length; ix++) {
            let matched = false;
            for (let jx = 0; jx < other.items.length; jx++) {
                if (this.items[ix].equalsOther(other.items[jx])) {
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                equals = false;
                break;
            }
        }
        return equals;
    }
}
