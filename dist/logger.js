"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const ansi = require("ansi-escape-sequences");
const console_1 = require("console");
const moment = require("moment");
const _console = new console_1.Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: false,
});
const config = {
    log: {
        color: ansi.style.white,
        io: process.stdout,
    },
    info: {
        color: ansi.style.green,
        io: process.stdout,
    },
    debug: {
        color: ansi.style.cyan,
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
exports.logger = {};
for (const fn of Object.keys(config)) {
    exports.logger[fn] = function () {
        config[fn].io.write(`${config[fn].color}[${moment().format('YYYY-MM-DD HH:mm:ss')}][${fn.toUpperCase()}] `);
        _console[fn].apply(_console, arguments);
    };
}

//# sourceMappingURL=logger.js.map
