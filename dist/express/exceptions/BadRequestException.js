"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestException = void 0;
const HttpException_1 = require("./HttpException");
class BadRequestException extends HttpException_1.HttpException {
    constructor(message) {
        super(message, 400);
        Object.setPrototypeOf(this, BadRequestException.prototype);
    }
}
exports.BadRequestException = BadRequestException;

//# sourceMappingURL=BadRequestException.js.map
