"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.get = exports.reload = void 0;
const YAML = require("yaml");
const paths_1 = require("./paths");
const fs = require("fs");
const jp = require("jsonpath");
function merge(target, source) {
    for (let key of Object.keys(source)) {
        if (source[key] instanceof Object) {
            Object.assign(source[key], merge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}
const configFilePath = (0, paths_1.configPath)('config.yml');
let config = {};
function reload() {
    config = YAML.parse(fs.readFileSync(configFilePath + '.example').toString('utf8'));
    if (fs.existsSync(configFilePath)) {
        config = merge(config, YAML.parse(fs.readFileSync(configFilePath).toString('utf8')));
    }
}
exports.reload = reload;
function get(path = '$', def = undefined) {
    let res = jp.query(config, path);
    if (res instanceof Array) {
        switch (res.length) {
            case 0:
                return def;
            case 1:
                return res[0] === undefined ? def : res[0];
            default:
                return res;
        }
    }
    return res === undefined ? def : res;
}
exports.get = get;
function format(template, data) {
    return template.replace(/\${([a-z]+)}/gi, (_, v) => data[v] ?? '');
}
exports.format = format;
reload();

//# sourceMappingURL=config.js.map
