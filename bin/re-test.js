'use strict';

const chalk = require('chalk');

const re = {
    '  AND': /\w+ AND \w+/i,
    'EXACT': /".+"/i,
    '   OR': /(\w+)(( \w+)+)?/i
};

const data = [
    'Agosti',
    'Agosti, Donat',
    '"Agosti, Donat"',
    'Donat Isaav Agosti',
    'Donat AND Agosti'
];

let i = 0;
const j = data.length;

for (; i < j; i++) {

    const d = data[i];
    let flag = false;
    

    for (let r in re) {
        //console.log(`testing ${d} against ${r}: ${re[r]}`)
        if (re[r].test(d)) {
            
            const m = d.match(re[r]);
            console.log(`${chalk.green.bold('match ' + r)} ${JSON.stringify(m)}`);
            flag = true;
            break;
        }
    }
 
    if (! flag) {
        console.log(`${chalk.red.bold('no match: ')} ${d}`);
    }
}