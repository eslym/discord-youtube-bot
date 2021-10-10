import {NextFunction, Request, Response} from "express";
import {parseStringPromise as parsexml} from "xml2js";

export async function xml(req: Request, res: Response, next: NextFunction) {
    if(req.is('xml')){
        try {
            req.body = await parsexml(req.raw.toString());
        } catch (_) {
            return res.status(422)
                .json({
                    success: false,
                    code: 422,
                    error: 'invalid_xml',
                    message: '422 Unprocessable Entity',
                });
        }
    }
    next();
}

export function json(req: Request, res: Response, next: NextFunction) {
    if(req.is('json')){
        try {
            req.body = JSON.parse(req.raw.toString());
            next();
        } catch (_) {
            return res.status(422)
                .json({
                    success: false,
                    code: 422,
                    error: 'invalid_json',
                    message: '422 Unprocessable Entity',
                });
        }
    }
    next();
}

export function need(...types: string[]){
    return (req: Request, res: Response, next: NextFunction) => {
        if(req.is(types)){
            next();
        } else {
            res.status(422)
                .json({
                    success: false,
                    code: 422,
                    error: 'unexpected_content_type',
                    message: '422 Unprocessable Entity',
                });
        }
    }
}
