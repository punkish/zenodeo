const argv = require('minimist')(process.argv.slice(2));

let opts = {
    download: false,
    rearrange: false,
    database: false,
    parseOne: false,
    parseAll: false
}

if (argv.download) opts.download = true;
if (argv.rearrange) opts.rearrange = true;
if (argv.database) opts.database = true;
if (argv.parse) opts.parse = argv.parse;

const allParamsFalse = !opts.download && !opts.rearrange && !opts.database && !opts.parse;

if (allParamsFalse || argv.usage) {
    
    console.log(`
usage: truebug --download {false|true} \\
               --rearrange {false|true} \\
               --database {false|true} \\
               --parse {treatment id || n = number of treatments to parse || 'all'}`
    )

}

module.exports = opts;