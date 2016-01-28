var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var item_collection_1 = require("./item_collection");
"use strict";
var BaseTeam = (function (_super) {
    __extends(BaseTeam, _super);
    function BaseTeam(id, players) {
        _super.call(this, players);
        this.id = id;
    }
    BaseTeam.prototype.countPlayers = function () {
        return this.countItems();
    };
    BaseTeam.prototype.playerAt = function (index) {
        return this.itemAt(index);
    };
    BaseTeam.prototype.hasPlayer = function (player) {
        return (this.indexOfItem(player) != -1);
    };
    BaseTeam.prototype.equalsOther = function (team) {
        return this.id == team.id;
    };
    return BaseTeam;
})(item_collection_1.ItemCollection);
exports.BaseTeam = BaseTeam;
//# sourceMappingURL=team.js.map