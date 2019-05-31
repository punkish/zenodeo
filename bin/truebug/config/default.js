const path = require('path')

module.exports = {

    "paths": {
        "timestampDir": path.join('.', 'download', 'timestamp.txt'),
        "newTreatmentsDir": path.join('..', '..', 'data', 'treatmentsNew2'), 
        "treatmentsListDir": path.join('..', '..', 'data', 'seach.xml')
    },

    "URLs": {
        "downloadTreatmentsURL": 'http://tb.plazi.org/GgServer/xml/',
        "downloadListURL": 'http://tb.plazi.org/GgServer/search?&indexName=0&resultFormat=XML&lastModifiedSince='
    }
}