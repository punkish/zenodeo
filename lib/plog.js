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

    return [prefix.padStart(19), msg];
};

module.exports = {
    log: function({header, messages}) {
        const r = 50;
        log.info('\n' + header);
        log.info('-'.repeat(r));
        messages.forEach(({l, p}) => {
            log.info(chalk.blue.bold(l) + ': ' + JSON.stringify(p));
        });
        log.info('='.repeat(r) + '\n');
    },

    info: function(param1, param2, color) {

        if (param1 === 'line') {
            log.info(param2.repeat(100));
        }
        else {
            let [prefix, msg] = prepareMsg(param1, param2);
            prefix = prefix + ': ';
            prefix = color ? chalk[color].bold(prefix) : chalk.blue.bold(prefix);
    
            log.info(`${prefix} ${msg}`);
        }

    },

    error: function(param1, param2, color) {

        if (param1 === 'line') {
            log.info(param2.repeat(100));
        }
        else {
            let [prefix, msg] = prepareMsg(param1, param2);
            prefix = prefix + ': ';
            prefix = color ? chalk[color].bold(prefix) : chalk.red.bold(prefix);
    
            log.info(`${prefix} ${msg}`);
        }

    }
};