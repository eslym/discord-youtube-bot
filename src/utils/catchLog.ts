import {logger} from "../logger";

type PromiseProvider<T> = (...args: unknown[]) => Promise<T> | T | undefined;

export function catchLog<T extends PromiseProvider<E>, E = unknown>(promiseProvider: T, level : keyof typeof logger = 'error'): T {
    return ((...args: unknown[]) => (new Promise((resolve)=>{
        resolve(promiseProvider(...args));
    })).catch(logger[level])) as any;
}
