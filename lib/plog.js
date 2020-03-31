'use strict';

const config = require('config');
const loglevel = config.get('loglevel');
const chalk = require('chalk');
const log = require('picolog');

// color red all queries that take longer than 
// the following (in ms)
const sqlThreshHold = 300;

log.level = log[loglevel];

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

const colors = {
    info: 'blue',
    error: 'red',
    perf: 'green'
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

        log.info('\n     ' + header);
        log.info('-'.repeat(r));
        
        messages.forEach(({label, params}) => {

            if (typeof(params) === 'object') {
                if ('sql' in params) {
                    const sql = params.sql;
                    const t = params.took;
    
                    const [s, ns] = t;
    
                    let ms = ns / 1000000;
                    if (ms >= 1000) {
                        s = s + Math.ceil(ms / 1000);
                        ms = ms - (s * 1000);
                    }
    
                    let sqlColor = chalk[colors.perf];
                    if (s || (ms > sqlThreshHold)) {
                        sqlColor = chalk[colors.error];
                    }

                    const m = `${s}s ${ms} ms`;
                    log.info(`${chalk[colors.info].bold(label.padStart(ll))}: ${sql} ${sqlColor.bold('[')} ${sqlColor(m)} ${sqlColor.bold(']')}`);
                }
            }
            else {
                const m = typeof(params) === 'object' ? JSON.stringify(params) : params;
                log.info(chalk[colors.info].bold(label.padStart(ll)) + ': ' + m);
            }
            
        });

        log.info('='.repeat(r) + '\n');
    },

    info: function(param1, param2) {

        if (param1 === 'line') {
            log.info(param2.repeat(100));
        }
        else {
            let [prefix, msg] = prepareMsg(param1, param2);
            prefix = prefix + ': ';
            prefix = chalk[colors.info].bold(prefix);
    
            log.info(`${prefix} ${msg}`);
        }

    },

    error: function(param1, param2) {

        if (param1 === 'line') {
            log.info(param2.repeat(100));
        }
        else {
            log.info(chalk[colors.error].bold(`error : ${param1}`));
            log.info(chalk[colors.error].bold(`sql : ${param2}`));
            
        }

    }
};