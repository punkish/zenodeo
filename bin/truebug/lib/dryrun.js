const fs = require('fs')

const source_dir = './data/treatmentsDump'
const target_dir = '/Users/punkish/Sites/plazi/data/diff'

const copyFiles = function() {
    const files = fs.readdirSync(source_dir)
    let i = 10002
    let j = 10202
    for (; i < j; i++) {
        fs.copyFile(`${source_dir}/${files[i]}`, `${target_dir}/${files[i]}`, (err) => {
            if (err) throw err
        })
    }
}

copyFiles()