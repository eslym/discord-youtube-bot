#!/usr/bin/node

if (process.env.NODE_ENV === 'production') {
    require('./dist/index');
} else {
    require('ts-node').register();
    require('./src/index');
}
