'use strict';

const fs = require('fs');
const readline = require('readline');
const records = 'data/records-2019-02-01T04:00:00.json';

const rl = readline.createInterface({
    input: fs.createReadStream(records)
});
  
let lineno = 0;
let c = {};
let k = {};
rl.on('line', function (line) {

    lineno++;
    if (!(lineno % 10000)) {
        console.log('processed ' + lineno + ' lines')
    }
    let r = JSON.parse(line);

    if (r.metadata.creators) {
        r.metadata.creators.forEach(element => {
            c[element.name] = 1;
        });
    }

    if (r.metadata.keywords) {
        r.metadata.keywords.forEach(element => {
            k[element] = 1;
        })
    }
    
});

rl.on('close', (input) => {
    let creators = [];
    let keywords = [];

    const carr = Object.keys(c);
    for (let i = 0, j = carr.length; i < j; i++) {
        let el = carr[i];
        el = el.replace(/\*/g, ''); 
        el = el.replace(/\t/g, '');
        if (el !== '') {
            creators.push(el.trim())
        }
    }

    const karr = Object.keys(k);
    for (let i = 0, j = karr.length; i < j; i++) {
        let el = karr[i];
        el = el.replace(/\*/g, ''); 
        el = el.replace(/\t/g, '');
        if (el !== '') {
            keywords.push(el.trim())
        }
    }

    fs.writeFileSync('data/authors-new.js', JSON.stringify({ authors: creators.sort() }), 'utf8');
    fs.writeFileSync('data/keywords-new.js', JSON.stringify({ keywords: keywords.sort() }), 'utf8');
});
