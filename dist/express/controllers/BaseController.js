"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = exports.controller = void 0;
const NotFoundException_1 = require("../exceptions/NotFoundException");
const controllerHandler = {
    get(target, p, _) {
        return (req, res, next) => {
            let controller = new target(req, res);
            new Promise((resolve) => resolve(controller[p]())).catch(next);
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
    resolveParam(key, paramResolver, required = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = undefined;
            if (this.request.params.hasOwnProperty(key)) {
                data = yield paramResolver(this.request.params[key]);
            }
            if (required && (data === undefined || data === null)) {
                throw new NotFoundException_1.NotFoundException();
            }
            return data;
        });
    }
}
exports.BaseController = BaseController;

//# sourceMappingURL=BaseController.js.map
