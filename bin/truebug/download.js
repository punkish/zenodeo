'use strict';

const exec = require('child_process').exec;
const ProgressBar = require('progress');
const http = require('http');
const fs = require('fs');

const config = require('config');
const downloadDir = config.get('bin.renew.download.downloadDir');
const fileName = config.get('bin.renew.download.fileName');
const host = config.get('bin.renew.download.host');
const port = config.get('bin.renew.download.port');
const pathToFile = config.get('bin.renew.download.pathToFile');

module.exports = function() {

    process.chdir(downloadDir);
    const file = fs.createWriteStream(fileName);

    const req = http.request({
        host: host,
        port: port,
        path: pathToFile + fileName
    });

    req.on('response', function(res){
        var len = parseInt(res.headers['content-length'], 10);
    
        console.log();
        let bar = new ProgressBar('  downloading [:bar] :rate/bps :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: len
        });
    
        res.on('data', function (chunk) {
            bar.tick(chunk.length);
            file.write(chunk);
        });
    
        res.on('end', function () {
            file.end();
            exec('unzip ' + fileName);
            exec('rm ' + fileName);
            console.log('\n');
        });
    });
    
    req.end();
};