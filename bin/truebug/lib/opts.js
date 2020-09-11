'use strict'

const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))
const path = require('path')

let opts = {
    download : false,
    rearrange: false,
    database : false,
    parse    : false
}

if (argv.download) {
    if (argv.download !== 'full' && argv.download !== 'diff' && argv.download.length !== 32) {
        argv.download = false;
    }
    
    opts.download = argv.download;
}

if (argv.rearrange) opts.rearrange = true;
if (argv.database)  opts.database  = true;
if (argv.parse)     opts.parse     = argv.parse;

const allParamsFalse = !opts.download && !opts.rearrange && !opts.database && !opts.parse;

if (allParamsFalse || argv.usage) {

    const title = chalk.blue.bold('truebug v. 2.0.1')

    const usage = chalk.magentaBright(`Usage: truebug \\
    --download  false | [ full | diff | <guid> ] \\
    --rearrange false | true \\
    --database  false | true \\
    --parse     false | all | n = number of treatments to parse | treatment_id`)
    
    const message = chalk.magenta(`truebug is an ETL program that can download treatments incrementally (those
changed since it was run last), parse the XMLs, insert the data into the 
database, and rearrange the treatments into a hierarchical directory 
structure so any single folder doesn't have too many treatments.

The default action is to do nothing as all options default to false;
    
truebug will change its working directory to ~/zenodeo root and run 
from there. The treatments will be downloaded and unzipped to a 
directory called ~/zenodeo/data/treatments-[yyyy-mm-dd]T[hh]h[mm]m[ss]s
    
--parse can be a treatment_id (GUID), or a number (for the number of 
treatments to parse) or the word 'all' to parse all the treatments.`)

    const examples = chalk.green(`Examples:

    1. Parse specific XMLs

    % truebug --parse 038787DAFFF7FF904BBFF925FD13F9AA
    % truebug --parse 730087F21E00FF81FF61FC34FDA561A5

    2. Parse 5000 XMLs from the treatments dump directory

    % truebug --parse 5000

    3. Parse all the XMLs in the treatments dump directory

    % truebug --parse 'all'

    4. Parse all XMLs, insert them in the database, and rearrange them 
    in the treatments directory in a hierachical directory structure so 
    they are easy to work with in the filesystem

% truebug --parse 'all' --database true --rearrange true`)

    
    console.log(`
${title}

${usage}

${message}

${examples}
`)

}
else {

    // make sure the process runs from ~/zenodeo
    const truebughome = path.dirname(process.argv[1]);
    process.chdir(truebughome);
    
    // now go up one
    process.chdir('../');
    
    // ready
}

module.exports = opts;