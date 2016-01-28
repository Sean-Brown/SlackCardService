"use strict";
var ItemCollection = (function () {
    function ItemCollection(items) {
        this.items = items;
    }
    ItemCollection.prototype.deepCopy = function () {
        return new ItemCollection(this.items.slice(0));
    };
    ItemCollection.prototype.indexOfItem = function (item) {
        var index = -1;
        for (var ix = 0; ix < this.items.length; ix++) {
            if (item.equalsOther(this.items[ix])) {
                index = ix;
                break;
            }
        }
        return index;
    };
    ItemCollection.prototype.countItems = function () {
        return this.items.length;
    };
    ItemCollection.prototype.insertItem = function (item, index) {
        this.items.splice(index, 0, item);
    };
    ItemCollection.prototype.addItem = function (item) {
        this.items.push(item);
    };
    ItemCollection.prototype.addItems = function (items) {
        this.items = this.items.concat(items);
    };
    ItemCollection.prototype.removeItem = function (item) {
        var index = this.indexOfItem(item);
        var hasItem = (index != -1);
        if (hasItem) {
            this.items.splice(index, 1);
        }
        return hasItem;
    };
    ItemCollection.prototype.removeAll = function () {
        this.items.splice(0, this.items.length);
    };
    ItemCollection.prototype.itemAt = function (index) {
        if (index < 0 || index > this.items.length) {
            throw "Index out of bounds!";
        }
        return this.items[index];
    };
    ItemCollection.prototype.equalsOther = function (other) {
        var equals = true;
        for (var ix = 0; ix < this.items.length; ix++) {
            var matched = false;
            for (var jx = 0; jx < other.items.length; jx++) {
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
    };
    return ItemCollection;
})();
exports.ItemCollection = ItemCollection;
//# sourceMappingURL=item_collection.js.map