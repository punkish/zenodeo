'use strict';

String.prototype.format = function(o) {
    //const args = arguments;
    console.log(o)
    return this.replace(/{(\w+)}/g, function(match, number) { 
        //return typeof args[number] != 'undefined' ? args[number] : match;

        // if (typeof args[number] != 'undefined') {
        //     console.log('num: ' + args[number]);
        //     return args[number];
        // }
        // else {
        //     console.log('mat: ' + match);
        //     return match;
        // }

        return
        
    });
};

let data = 'SELECT id, treatmentId, treatmentTitle, doi AS articleDoi, zenodoDep, zoobank, articleTitle, publicationDate, journalTitle, journalYear, journalVolume, journalIssue, pages, authorityName, authorityYear, kingdom, phylum, "order", family, genus, species, status, taxonomicNameLabel, rank FROM treatments WHERE deleted = 0 ORDER BY {1} {0} LIMIT @limit OFFSET @offset';

console.log(data.format('phylum', 'ASC'));