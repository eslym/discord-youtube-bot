import * as ansi from 'ansi-escape-sequences';
import {EventEmitter} from "events";
import * as util from "util";
import * as os from "os";
import * as inspector from "inspector";
import moment = require("moment");

type LogFn = (this: Logger, ...data: any) => void;

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export declare interface Logger {
    on(event: 'record', listener: (level: LogLevel, data: string, raw: any) => any): this;

    once(event: 'record', listener: (level: LogLevel, data: string, raw: any) => any): this;
}

export class Logger extends EventEmitter {
    readonly log: LogFn;
    readonly info: LogFn;
    readonly warn: LogFn;
    readonly error: LogFn;

    constructor() {
        super();
    }
}

for (let level of ['log', 'info', 'warn', 'error']) {
    Logger.prototype[level] = function (...data: any) {
        let prepend = `[${moment().format('YYYY-MM-DD HH:mm:ss')}][${level.toUpperCase()}]`;
        let indent = os.EOL + ' '.repeat(prepend.length);
        for (let record of data) {
            let str = util.inspect(record, false, 2, false);
            this.emit('record', level, prepend + str.split(/\r?\n|\n?\r/).join(indent), record);
        }
    }
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
}

export function StdioListener(level: LogLevel, record: string, data: any) {
    config[level].io.write(config[level].color + record);
    config[level].io.write(os.EOL + ansi.style.reset);
    (inspector as any as { console: Console }).console[level](data);
}

export const logger = new Logger();
logger.on('record', StdioListener);
