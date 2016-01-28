var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var team_1 = require("../base_classes/collections/team");
var card_game_1 = require("../base_classes/card_game");
"use strict";
var CribbageTeamErrorStrings = (function () {
    function CribbageTeamErrorStrings() {
    }
    CribbageTeamErrorStrings.PLAYER_NOT_ON_TEAM = "Player not on this team!";
    return CribbageTeamErrorStrings;
})();
exports.CribbageTeamErrorStrings = CribbageTeamErrorStrings;
var CribbageTeam = (function (_super) {
    __extends(CribbageTeam, _super);
    function CribbageTeam(id, players) {
        _super.call(this, id, players);
    }
    CribbageTeam.prototype.countPoints = function () {
        var points = 0;
        for (var index = 0; index < this.countItems(); index++) {
            points += this.itemAt(index).points;
        }
        return points;
    };
    CribbageTeam.prototype.addPoints = function (player, points) {
        var index = this.indexOfItem(player);
        if (index == -1) {
            throw CribbageTeamErrorStrings.PLAYER_NOT_ON_TEAM;
        }
        this.itemAt(index).addPoints(points);
        return (this.countPoints() > 120);
    };
    CribbageTeam.prototype.hasPlayer = function (player) {
        return (this.indexOfItem(player) != -1);
    };
    CribbageTeam.prototype.numPlayers = function () {
        return this.countItems();
    };
    CribbageTeam.prototype.printTeam = function () {
        var team = "";
        for (var ix = 0; ix < this.numPlayers(); ix++) {
            team += this.itemAt(ix).name + ", ";
        }
        return card_game_1.removeLastTwoChars(team);
    };
    return CribbageTeam;
})(team_1.BaseTeam);
exports.CribbageTeam = CribbageTeam;
//# sourceMappingURL=cribbage_team.js.map