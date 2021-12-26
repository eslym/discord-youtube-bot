import {logger, LogLevel} from "../logger";

type PromiseProvider<T> = (...args: unknown[]) => Promise<T> | T | undefined;

export function catchLog<T extends PromiseProvider<E>, E = unknown>(promiseProvider: T, level: LogLevel = 'error'): T {
    return ((...args: unknown[]) => (new Promise((resolve) => {
        resolve(promiseProvider(...args));
    })).catch((err)=>logger[level](err))) as any;
}
