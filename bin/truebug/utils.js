'use strict';

const { performance } = require('perf_hooks');

module.exports = function(options) {

    if (options.startMsg) {

        // see the following link on tip to write to the console
        // without a trainling newline
        // https://stackoverflow.com/questions/6157497/node-js-printing-to-console-without-a-trailing-newline
        process.stdout.write(options.startMsg)
        return performance.now(); 

    }
    else if (options.startTime) {  

        const t = performance.now();
        const dur = (t - options.startTime).toFixed(2);
        console.log(` took ${dur} ms`);

    }
}