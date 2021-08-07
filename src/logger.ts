import * as ansi from 'ansi-escape-sequences';
import { Console } from 'console';

type LogFn = (...data: any)=> void;
type Logger = {log: LogFn, info: LogFn, debug: LogFn, warn: LogFn, error: LogFn}

const _console = new Console({
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
}

export const logger: Logger = {} as any;

for (const fn of Object.keys(config)) {
    logger[fn] = function (){
        config[fn].io.write(`${config[fn].color}[${(new Date()).toISOString()}][${fn.toUpperCase()}] `);
        _console[fn].apply(_console, arguments);
    }
}
