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

        // overall length of message string in the console (or in the log file)
        // this is the length of the label + the length of the message
        const r = 200;

        // calculate label length
        let ll = 0;

        let i = 0;
        const j = messages.length;
        for (; i < j; i++) {
            const {label, params} = messages[i];
            const l = label.length;
            if (l > ll) {
                ll = l;
            }
        }
        ll += 1;
        
        // message length
        const ml = r - ll;

        log.info('\n     ' + header);
        log.info('-'.repeat(r));
        
        messages.forEach(({label, params}) => {

            // message
            const m = JSON.stringify(params);
            const len = m.length;
            
            if (len < ml) {
                log.info(chalk.blue.bold(label.padStart(ll)) + ': ' + m);
            }
            else {
                let i = 0;
                const j = Math.floor(len / ml);
                const padding = ' '.repeat(ll);

                for (; i < j; i++) {

                    const start = i * ml;
                    const end = start + ml;
                    
                    let str = i === 0 ? chalk.blue.bold(label.padStart(ll)) : padding;
                    str = str + ': ' + m.substring(start, end);
                    log.info(str);
                }

                const start = i * ml;
                log.info(padding + ': ' + m.substring(start));
            }
            
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