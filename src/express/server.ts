import {Express, Router} from "express";
import * as express from "express";
import concat = require("concat-stream");
import * as middleware from "./middleware";
import {controller} from "./controllers/BaseController";
import {WebSubController} from "./controllers/WebSubController";
import {HttpException} from "./exceptions/HttpException";

declare global {
    namespace Express {
        interface Request {
            raw?: Buffer;
        }
    }
}

export const server = express();
const router = Router();

router.use((req, _, next) => {
    req.pipe(concat({encoding: 'buffer'}, (buf) => {
        req.raw = buf;
        next();
    }))
});

router.use(middleware.json, middleware.xml);

function notFound(req, res) {
    res.status(404)
        .json({
            success: false,
            code: 404,
            error: 'not_found',
            message: '404 Not Found',
        });
}

server.use('/', router, notFound);

server.use((err, req: express.Request, res: express.Response, _: express.NextFunction) => {
    if (!res.headersSent) {
        let body: any = {
            success: false,
            code: 500,
            message: '500 Internal Server Error',
        };
        if (err instanceof HttpException) {
            body.code = err.status
            body.message = err.message
        } else {
            console.error(err);
        }
        if (process.env.DEBUG === 'true') {
            body.exception = err;
        }
        res.status(body.code).json(body);
    }
});

router.get('/websub/:websub', controller(WebSubController).subscribe);

router.post('/websub/:websub', controller(WebSubController).callback);
