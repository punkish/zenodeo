const config = require('config');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));

const getData = function(sql, queryObject) {
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.all(queryObject);
        console.log(result);
    }
    catch (error) {
        console.log(error);
    }
}

const datasql = "SELECT id, treatments.treatmentId, treatmentTitle, doi AS articleDoi, zenodoDep, zoobank, articleTitle, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, \"order\", family, genus, species, status, taxonomicNameLabel, treatments.rank FROM treatments WHERE treatments.deleted = 0 AND treatments.rank LIKE @rank AND treatmentTitle LIKE @treatmentTitle ORDER BY journalYear ASC LIMIT @limit OFFSET @offset";

const facetssql = "SELECT journalTitle, Count(journalTitle) AS c FROM treatments WHERE treatments.deleted = 0 AND journalTitle != '' AND treatments.rank LIKE @rank AND treatmentTitle LIKE @treatmentTitle GROUP BY journalTitle";

const queryObject = {"facets":true,"stats":true,"rank":"genus","treatmentTitle":"carabus","xml":false,"sortBy":"treatmentId:ASC","refreshCache":false,"page":1,"size":30,"resource":"treatments","resourceId":"treatmentId","path":"treatments","limit":30,"offset":0};

getData(facetssql, { rank: 'genus%', treatmentTitle: 'carabus%', limit: 30, offset: 0 });