'use strict';

const chalk = require('chalk');
const log = require('picolog');
log.level = log.INFO;

const prepareMsg = function(param1, param2) {
    let prefix = 'info';
    let msg = '';

    if (param2) {

        prefix = param1;

        if (Array.isArray(param2)) {
            msg = param2.join('');
        }
        else if (typeof(param2) === 'object') {
            msg = JSON.stringify(param2);
        }
        else {
            msg = param2;
        }

    }
    else {
        msg = param1;
    }

    return [prefix, msg];
};

module.exports = {
    info: function(param1, param2) {

        const [prefix, msg] = prepareMsg(param1, param2);
        log.info(chalk.blue.bold(prefix+ ': ') + ' ' + chalk.white(msg));

    },

    error: function(param1, param2) {

        const [prefix, msg] = prepareMsg(param1, param2);
        log.error(chalk.blue.bold(prefix+ ': ') + ' ' + chalk.white(msg));

    }
};