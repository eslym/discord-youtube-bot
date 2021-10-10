"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = require("express");
const express = require("express");
const concat = require("concat-stream");
const middleware = require("./middleware");
const BaseController_1 = require("./controllers/BaseController");
const WebSubController_1 = require("./controllers/WebSubController");
const HttpException_1 = require("./exceptions/HttpException");
exports.server = express();
const router = (0, express_1.Router)();
router.use((req, _, next) => {
    req.pipe(concat({ encoding: 'buffer' }, (buf) => {
        req.raw = buf;
        next();
    }));
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
exports.server.use('/', router, notFound);
exports.server.use((err, req, res, _) => {
    if (!res.headersSent) {
        let body = {
            success: false,
            code: 500,
            message: '500 Internal Server Error',
        };
        if (err instanceof HttpException_1.HttpException) {
            body.code = err.status;
            body.message = err.message;
        }
        else {
            console.error(err);
        }
        if (process.env.DEBUG === 'true') {
            body.exception = err;
        }
        res.status(body.code).json(body);
    }
});
router.get('/websub/:websub', (0, BaseController_1.controller)(WebSubController_1.WebSubController).subscribe);
router.post('/websub/:websub', (0, BaseController_1.controller)(WebSubController_1.WebSubController).callback);

//# sourceMappingURL=server.js.map
