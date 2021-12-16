import * as HBS from 'handlebars';
import config = require('config');

function compile(text) {
    return HBS.compile(text, {
        noEscape: true
    });
}

export const format = {
    video: compile(config.get('notification.video')),
    live: compile(config.get('notification.live')),
    reschedule: compile(config.get('notification.reschedule')),
    starting: compile(config.get('notification.starting')),
};
