'use strict'

const execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const config = require('config')
const hostname = config.get('truebug.hostname')
const downloads = config.get('truebug.downloads')
const treatmentsDump = config.get('truebug.treatmentsDump')

// const curl = function(file, url, dir) {
//     const cmd = spawn('curl', ['--output', file, url])

//     cmd.stdout.on('data', function (data) {
//         console.log('stdout: ' + data.toString())
//     });
    
//     cmd.stderr.on('data', function (data) {
//         console.log('stderr: ' + data.toString())
//     });

//     cmd.on('exit', function(code) {
//         console.log(`downloaded ${url} to ${file}`)
//         unzip(file, dir)
//     })
// }

// const del = function(file) {
//     console.log(`deleting file ${file}`)
//     fs.unlink(file, (err) => {
//         if (err) throw err;
//         console.log(`${file} was deleted`);
//     })
// }

// const unzip = function(file, dir) {
//     const cmd = spawn('unzip', ['-q', '-n', file, '-d', dir])

//     cmd.stdout.on('data', function (data) {
//         console.log('stdout: ' + data.toString())
//     })
    
//     cmd.stderr.on('data', function (data) {
//         console.log('stderr: ' + data.toString())
//     })

//     cmd.on('exit', function(code) {
//         console.log(`unzipped ${file} to ${dir}`)
//         del(file)
//     })
// }

const download = function(downloadtype) {

    const filename = downloads[downloadtype]

    // a date-time stamp that looks like `[yyyy-mm-dd]-[hh]h[mm]m[ss]s`
    const dt = new Date()
        .toISOString()
        .replace(/\..+/, '')
        .replace(/T(\d\d):(\d\d):(\d\d)/, '-$1h$2m$3s')
        
    const ext = '.zip';
    const basename = path.basename(filename, ext)

    // rename the source file by adding date-time stamp to its basename
    const new_filename = `${basename}-${dt}${ext}`

    // check if output dump directory exists, otherwise create it
    try {
        const stats = fs.statSync(treatmentsDump)
    }
    catch(error) {
        if(error.code === 'ENOENT') {
            process.stdout.write(`creating ${treatmentsDump}… `)
            fs.mkdirSync(treatmentsDump)
            console.log('done')
        }
    }        

    process.stdout.write(`downloading ${hostname}/${filename} to ${new_filename}… `)
    execSync(`curl --output ${new_filename} ${hostname}/${filename}`)
    console.log('done')

    process.stdout.write(`unzipping ${new_filename} to ${treatmentsDump}… `)
    execSync(`unzip -q -n ${new_filename} -d ${treatmentsDump}`)
    console.log('done')

    // console.log(`deleting ${new_filename}`)
    execSync(`rm ${new_filename}`)
}


module.exports = function(downloadtype) {

    process.chdir('./data/')

    if ( downloadtype === 'full' ) {

        download(downloadtype)
        
        
        // download()

        

    }
    else {
        
    }
};





//unzip -o 1b1-2020-08-13-05h54m57s.zip -d treatments-2020-08-13-06h00m01s | awk 'BEGIN {ORS=""} {if(NR%1==0)print "."}'