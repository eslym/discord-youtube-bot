import config = require('config');
import {createClient} from 'redis';

export const redis = createClient(
    config.has('redis') ?
        config.get('redis') : {}
);
