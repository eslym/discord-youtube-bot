"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = void 0;
const HBS = require("handlebars");
const config = require("config");
function compile(text) {
    return HBS.compile(text, {
        noEscape: true
    });
}
exports.format = {
    video: compile(config.get('notification.video')),
    live: compile(config.get('notification.live')),
    reschedule: compile(config.get('notification.reschedule')),
    starting: compile(config.get('notification.starting')),
    started: compile(config.get('notification.started')),
};

//# sourceMappingURL=format.js.map
