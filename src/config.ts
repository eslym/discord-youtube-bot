import * as YAML from 'yaml';
import {configPath} from './paths';
import * as fs from 'fs';
import * as jp from 'jsonpath';

function merge(target: any, source: any) {
    for (let key of Object.keys(source)) {
        if (source[key] instanceof Object) {
            Object.assign(source[key], merge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

const configFilePath = configPath('config.yml');
let config: object = {};

export function reload() {
    config = YAML.parse(fs.readFileSync(configFilePath + '.example').toString('utf8'));
    if (fs.existsSync(configFilePath)) {
        config = merge(config, YAML.parse(fs.readFileSync(configFilePath).toString('utf8')));
    }
}

export function get(path: string = '$', def: any = undefined): any {
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

export function format(template: string, data: object) {
    return template.replace(/\${([a-z]+)}/gi, (_, v) => data[v] ?? '');
}

reload();
