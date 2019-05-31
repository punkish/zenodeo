const path = require('path')

module.exports = {

    "paths": {
        "timestampDir": path.join('.', 'download', 'timestamp.txt'),
        "newTreatmentsDir": path.join('..', '..', 'data', 'treatmentsNew3'), 
        "treatmentsListDir": path.join('..', '..', 'data')
    },

    "URLs": {
        "downloadTreatmentsURL": 'http://tb.plazi.org/GgServer/xml/',
        "downloadListURL": 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince='
    }
}