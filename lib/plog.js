'use strict';

const config = require('config');
const loglevel = config.get('loglevel');
const chalk = require('chalk');
const log = require('picolog');
const Utils = require('../api/v2/utils');
//const crypto = require('crypto');


// all queries that take longer than the 
//  following (in ms) are displayed in red
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
            msg = JSON.stringify(param2, null, '    ');
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

    log: function({header, messages, queryObject}) {

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
                    const sql = Utils.strfmt(params.sql, queryObject);
                    
                    const t = params.took;
                    
                    let sqlColor = chalk[colors.perf];
                    if (t.msr > sqlThreshHold) {
                        sqlColor = chalk[colors.error];
                    }

                    
                    log.info(`${chalk[colors.info].bold(label.padStart(ll))}: ${sql} ${sqlColor.bold('[')} ${sqlColor(t.str)} ${sqlColor.bold(']')}`);

/*
CREATE TABLE webqueries (
    id INTEGER PRIMARY KEY,

    -- stringified queryObject
    qp TEXT NOT NULL UNIQUE,

    -- counter tracking queries
    count INTEGER DEFAULT 1
);

CREATE TABLE sqlqueries (
    id INTEGER PRIMARY KEY,

    -- SQL query
    sql TEXT NOT NULL UNIQUE
);

CREATE TABLE stats (
    id INTEGER PRIMARY KEY,

    -- Foreign Keys
    webqueries_id INTEGER,
    sqlqueries_id INTEGER,

    -- query performance time in ms
    timeTaken INTEGER,

    -- timestamp of query
    created INTEGER DEFAULT (strftime('%s','now')) 
);
*/


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