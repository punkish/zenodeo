'use strict';

/***********************************************************************
 * 
 * A custom-logger based on picolog and chalk
 * 
 **********************************************************************/

const log = require('picolog');
const chalk = require('chalk');
const config = require('config');
const loglevel = config.get('loglevel');
const logSlowSQLthreshold = config.get('logSlowSQLthreshold');
const Utils = require('../api/v2/utils');
const httpStatusCodes = require(config.get('httpStatusCodes'));
const Database = require('better-sqlite3');
const db = new Database(config.get('data.logs'));
const logfields = config.get('logfields'); 
const emailer = require('./emailer');

const insertStmt = `INSERT INTO log (${logfields.map(c => { return c.col }).join(', ')}) VALUES (${logfields.map(c => '?').join(', ')})`;

// create table
// const columns = logfields.map(c => { return `${c.col} ${c.type}` });
// columns.unshift("id INTEGER PRIMARY KEY", "logged INTEGER DEFAULT (strftime('%s', 'now'))");
// db.prepare(`CREATE TABLE IF NOT EXISTS log (${columns.join(', ')})`).run();

const insert = db.prepare(insertStmt);

// Set the log level (based on whether the app is running in development
// or testing or production mode) that determines what is printed and how
log.level = log[loglevel];

const colors = {
    info: chalk['blue'],
    error: chalk['red'],
    perf: chalk['green']
};

// overall length of message string in the console (or in the log file)
// this is the length of the label + the length of the message
const r = 70;


module.exports = {

    logger: function(params) {

        // logparams[] ensures the params are in the right order for 
        // the database insert statement
        const logparams = logfields.map(f => params[f.col]);

        // Timestamp
        const d = new Date();
    
        // set default start and end UTC times in ms, if not provided
        if (params.start === '') params.start = d.getTime();
        if (params.end === '') params.end = d.getTime();
    
        // calculate duration of event
        const t = params.end - params.start;
    
        const subject = 'zenodeo log';
        const msgParts = [
            [ 'Date', d.toUTCString() ],
            [ 'Host', params.host ],
            [ 'Resource/Action', params.resource ],
            [ 'Action', params.query ],
            [ 'Status', httpStatusCodes[ params.status ] ],
            [ 'Took', t ? `${t}ms` : 'n/a' ],
            [ 'Message', params.message ]
        ];
    
        // only if in production
        if (process.env.NODE_ENV === 'production') {
    
            // insert in the database
            insert.run(logparams);
    
            if (parseInt(params.status) >= 500) {
    
                try {
                    emailer({
                        subject: subject, 
                        message: msgParts.map(e => `${e[0].padStart(10)}: ${e[1]}`)
                            .join('\n')
                    });
                }
                catch(error) {
                    plog.error(error);
                }
    
            }
        }
    
        // show in the console
        else {
            log.info('\n');
            log.info(`subject: ${subject}`);
            log.info('-'.repeat(r));
            msgParts.forEach(e => log.info(e[0].padStart(10), e[1]));
            log.info('='.repeat(r));
        }
        
    },


    // `log` prints out messages grouped by the header. Here is an example
    // where the details of the labels "cacheKey" and "info" are grouped 
    // under the WEB QUERY header
    //
    // WEB QUERY
    // -------------------------------------------------------------------
    // cacheKey: /v2/treatments?facets=true&limit=30&offset=…
    //     info: querying for fresh results
    // ===================================================================
    log: function({ header, messages, queryObject }) {

        // calculate apprpropiate label length by finding the longest label
        // in the group and adding 1 to it for padding
        const ll = Math.max( ...messages.map( e => e.label.length ) ) + 1;

        log.info('\n');
        log.info(chalk.bold(header));
        log.info('-'.repeat(r));
        
        messages.forEach(({label, params}) => {

            if (typeof(params) === 'object') {

                // 'sql' is treated special
                if ('sql' in params) {

                    // Replace the bind param placeholders in the SQL with the 
                    // actual values from the queryObject so the actualy SQL
                    // that is run is printed in the log. This makes it easy to 
                    // debug a specific SQL in case of an error
                    const sql = Utils.strfmt(params.sql, queryObject);
                    
                    const { timeInMs, timeInEnglish } = params.took;
                    
                    const sqlColor = timeInMs > logSlowSQLthreshold ? colors.error 
                                   : colors.perf

                    
                    log.info(`${colors.info.bold(label.padStart(ll))}: ${sql} ${sqlColor.bold('[')} ${sqlColor(timeInEnglish)} ${sqlColor.bold(']')}`);

                }
                else {

                    log.info(colors.info.bold(label.padStart(ll)) + ': ' + JSON.stringify(params));
                }
            }
            else {

                log.info(colors.info.bold(label.padStart(ll)) + ': ' + params);
            }
            
        });

        log.info('='.repeat(r));

    },


    info: function(param1, param2) {

        const prefix = param2 ? param1 : 'info';
        let msg = param1;

        if (param2) {

            if (Array.isArray(param2)) {
                msg = param2.join('');
            }
            else if (param2.constructor === Object) {
                msg = JSON.stringify(param2, null, '  ');
            }
            else {
                msg = param2;
            }
        }

        log.info(colors.info.bold(prefix + ': ') + msg);

    },

    error: function(param1, param2) {
        
        // https://stackoverflow.com/a/61333525/183692
        if (param1.constructor === Object || Error) {

            const e = param1.stack === undefined ? JSON.stringify(param1.message, null, 2) : param1.stack;
            log.info(colors.error.bold('error: ') + colors.error(e));

            if (param2) {

                log.info(colors.error.bold('more: ') + param2);
            }
            
        }

    }
};