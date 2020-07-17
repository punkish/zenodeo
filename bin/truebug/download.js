'use strict';

const exec = require('child_process').exec;
const ProgressBar = require('progress');
const http = require('http');
const fs = require('fs');
const path = require('path');

const config = require('config');
const hostname = config.get('truebug.hostname');
const download = config.get('truebug.download');

module.exports = function(downloadtype) {

    process.chdir('./data/');

    // a date-time stamp that looks like `[yyyy-mm-dd]-[hh]h[mm]m[ss]s`
    const dt = new Date()
        .toISOString()
        .replace(/\..+/, '')
        .replace(/T(\d\d):(\d\d):(\d\d)/, '-$1h$2m$3s');


    if ( downloadtype === 'full' ) {

        const ext = '.zip';
        const basename = path.basename(download[downloadtype], ext);

        // rename the source file by adding date-time stamp to its basename
        const filename = `${basename}-${dt}${ext}`;
        const target = fs.createWriteStream(filename);
        const req = http.request({
            hostname: hostname,
            path: `/${download[downloadtype]}`
        });

        req.on('response', function(res) {
            const len = parseInt(res.headers['content-length'], 10);
            
            let bar = new ProgressBar(`downloading ${hostname}/${download[downloadtype]} [:bar] :rate/bps :percent :etas`, {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: len
            });
        
            res.on('data', function (chunk) {
                bar.tick(chunk.length);
                target.write(chunk);
            });
        
            res.on('end', function () {
                target.end();

                console.log(`downloaded ${len} bytes to data/${filename}`);
                console.log(`unzipping ${filename} to treatments-${dt}`)
                exec(`unzip -q ${filename} -d treatments-${dt}`);

                console.log(`deleting ${filename}`);
                exec(`rm ${filename}`);
            });
        });
        
        req.end();

    }
    else {
        
    }
};