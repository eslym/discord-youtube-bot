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
exports.need = exports.json = exports.xml = void 0;
const xml2js_1 = require("xml2js");
function xml(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.is('xml')) {
            try {
                req.body = yield (0, xml2js_1.parseStringPromise)(req.raw.toString());
            }
            catch (_) {
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
    });
}
exports.xml = xml;
function json(req, res, next) {
    if (req.is('json')) {
        try {
            req.body = JSON.parse(req.raw.toString());
            next();
        }
        catch (_) {
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
exports.json = json;
function need(...types) {
    return (req, res, next) => {
        if (req.is(types)) {
            next();
        }
        else {
            res.status(422)
                .json({
                success: false,
                code: 422,
                error: 'unexpected_content_type',
                message: '422 Unprocessable Entity',
            });
        }
    };
}
exports.need = need;

//# sourceMappingURL=middleware.js.map
