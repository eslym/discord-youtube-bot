import {logger} from "../logger";

type PromiseProvider = (...args: unknown[]) => Promise<unknown>;

export function catchLog<T extends PromiseProvider>(promiseProvider: T): T {
    return ((...args: unknown[]) => promiseProvider(...args)
        .catch(logger.error)) as any;
}
