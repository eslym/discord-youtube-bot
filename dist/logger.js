"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.StdioListener = exports.Logger = void 0;
const ansi = require("ansi-escape-sequences");
const events_1 = require("events");
const util = require("util");
const os = require("os");
const inspector = require("inspector");
const moment = require("moment");
class Logger extends events_1.EventEmitter {
    constructor() {
        super();
    }
}
exports.Logger = Logger;
for (let level of ['log', 'info', 'warn', 'error']) {
    Logger.prototype[level] = function (...data) {
        let prepend = `[${moment().format('YYYY-MM-DD HH:mm:ss')}][${level.toUpperCase()}]`;
        let indent = os.EOL + ' '.repeat(this.indent ?? prepend.length);
        for (let record of data) {
            if (typeof record !== "string") {
                record = util.inspect(record, false, 2, false);
            }
            this.emit('record', level, prepend + record.split(/\r?\n|\n?\r/).join(indent), record);
        }
    };
}
const config = {
    log: {
        color: ansi.style.white,
        io: process.stdout,
    },
    info: {
        color: ansi.style.green,
        io: process.stdout,
    },
    warn: {
        color: ansi.style.yellow,
        io: process.stderr,
    },
    error: {
        color: ansi.style.red,
        io: process.stderr,
    },
};
function StdioListener(level, record, data) {
    config[level].io.write(config[level].color + record);
    config[level].io.write(os.EOL + ansi.style.reset);
    inspector.console[level](data);
}
exports.StdioListener = StdioListener;
exports.logger = new Logger();
exports.logger.on('record', StdioListener);

//# sourceMappingURL=logger.js.map
