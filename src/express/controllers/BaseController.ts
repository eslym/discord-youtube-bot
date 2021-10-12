import {NextFunction, Request, Response} from "express";
import {NotFoundException} from "../exceptions/NotFoundException";
import {logger} from "../../logger";
import {HttpException} from "../exceptions/HttpException";

declare type ControllerClass<T extends BaseController> = new (request: Request, response: Response)=>T;

const controllerHandler: ProxyHandler<ControllerClass<BaseController>> = {
    get(target: ControllerClass<BaseController>, p: PropertyKey, _: any): any {
        return (req: Request, res: Response, next: NextFunction)=>{
            let controller = new target(req, res);
            new Promise((resolve)=>resolve(controller[p]())).catch(err => {
                if(!(err instanceof HttpException)){
                    logger.error(err);
                }
                next(err);
            });
        }
    }
};

type RouteHandlerResolver<T extends BaseController> = {
    readonly [P in keyof T]: (req: Request, res: Response)=>any;
}

export function controller<T extends BaseController>(kelas: ControllerClass<T>): RouteHandlerResolver<T>{
    return new Proxy(kelas, controllerHandler) as any;
}

export abstract class BaseController{
    protected request: Request;
    protected response: Response;

    constructor(request: Request, response: Response) {
        this.request = request;
        this.response = response;
    }

    protected async resolveParam<T>(key: string, paramResolver: (key: string)=>T, required: boolean = false){
        let data: T = undefined;
        if(this.request.params.hasOwnProperty(key)){
            data = await paramResolver(this.request.params[key]);
        }
        if(required && (data === undefined || data === null)){
            throw new NotFoundException();
        }
        return data;
    }
}
