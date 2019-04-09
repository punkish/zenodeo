const argv = require('minimist')(process.argv.slice(2));

let params = {
    download: false,
    rearrange: false,
    database: false,
    parseOne: false,
    parseAll: false
}

if (argv.download === 'true') {
    params.download = true;
}

if (argv.rearrange === 'true') {
    params.rearrange = true;
}

if (argv.database === 'true') {
    params.database = true;
}

if (argv.parseOne) {
    params.parseOne = argv.parseOne
}
else {
    if (argv.parseAll === 'true') {
        params.parseAll = true;
    }
}

const allParamsFalse = !params.download && !params.rearrange && !params.database && !params.parseOne && !params.parseAll;

if (allParamsFalse || argv.usage) {
    
    console.log(
        `\n
        usage: renew --download {false|true} \\
                     --rearrange {false|true} \\
                     --database {false|true} \\
                     --parseOne {filename} \\
                     --parseAll {false|true}

                notes: if --parseOne is present then 
                       --parseAll defaults to false`
    )

}

module.exports = params;