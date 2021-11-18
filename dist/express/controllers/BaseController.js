"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = exports.controller = void 0;
const NotFoundException_1 = require("../exceptions/NotFoundException");
const logger_1 = require("../../logger");
const HttpException_1 = require("../exceptions/HttpException");
const controllerHandler = {
    get(target, p, _) {
        return (req, res, next) => {
            let controller = new target(req, res);
            new Promise((resolve) => resolve(controller[p]())).catch(err => {
                if (!(err instanceof HttpException_1.HttpException)) {
                    logger_1.logger.error(err);
                }
                next(err);
            });
        };
    }
};
function controller(kelas) {
    return new Proxy(kelas, controllerHandler);
}
exports.controller = controller;
class BaseController {
    constructor(request, response) {
        this.request = request;
        this.response = response;
    }
    async resolveParam(key, paramResolver, required = false) {
        let data = undefined;
        if (this.request.params.hasOwnProperty(key)) {
            data = await paramResolver(this.request.params[key]);
        }
        if (required && (data === undefined || data === null)) {
            throw new NotFoundException_1.NotFoundException();
        }
        return data;
    }
}
exports.BaseController = BaseController;

//# sourceMappingURL=BaseController.js.map
