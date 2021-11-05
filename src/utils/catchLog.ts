import {logger} from "../logger";

export function catchLog(promiseProvider: ()=>Promise<unknown>){
    return ()=>promiseProvider()
        .catch(logger.error);
}
