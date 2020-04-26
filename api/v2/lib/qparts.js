'use strict';

/***********************************************************************
 * 
 * Query definitions for every resource.
 * 
 * A query is made up of seven parts
 * 
 * three mandatory parts
 * -----------------------------
 * SELECT <columns> 
 * FROM <tables> 
 * WHERE <constraint> 
 * 
 * four optional parts
 * -----------------------------
 * GROUP BY <group>
 * ORDER BY <sortcol> <sortdir> 
 * LIMIT <limit> 
 * OFFSET <offset>
 *
 **********************************************************************/

const queryParts = {
    treatments: {
        pk: 'treatmentId',

        queries: {

            // 'count' and 'data' queries are always performed for all queries
            essential: {
                count: {
                    columns: ['count(*) as numOfRecords'],
                    tables: ['treatments'],
                    constraint: ['treatments.deleted = 0'],
                    sortBy: {},
                    group: []
                },
    
                data: {
                    columns: [
                        'id', 
                        'treatments.treatmentId', 
                        'treatmentTitle', 
                        'doi AS articleDoi', 
                        'zenodoDep', 
                        'zoobank', 
                        'articleTitle', 
                        'publicationDate', 
                        'journalTitle', 
                        'journalYear', 
                        'journalVolume', 
                        'journalIssue', 
                        'pages', 
                        'authorityName', 
                        'authorityYear', 
                        'kingdom', 
                        'phylum', 
                        '"order"', 
                        'family', 
                        'genus', 
                        'species', 
                        'status', 
                        'taxonomicNameLabel', 
                        'treatments.rank'
                    ],
                    tables: ['treatments'],
                    constraint: ['treatments.deleted = 0'],
                    sortBy: {
                        columns: ['journalYear'],
                        defaultSort: {
                            col: 'journalYear',
                            dir: 'ASC'
                        }
                    },
                    group: [],
                    pagination: true,
                    limit: 30,
                    offset: 0
                }
            },

            // taxonStats queries are performed when a single 
            // resource is queried by sending a resourceId
            taxonStats: {
                kingdom: {
                    columns: [ 'Count(*) AS num' ],
                    tables: ['treatments'],
                    constraint: [
                        'deleted = 0',
                        `kingdom = (
                            SELECT kingdom
                            FROM treatments
                            WHERE deleted = 0 AND treatmentId = @treatmentId
                        )`
                    ],
                    sortBy: {},
                    group: []
                },

                phylum: {
                    columns: [ 'Count(*) AS num' ],
                    tables: ['treatments'],
                    constraint: [
                        'deleted = 0',
                        `phylum = (
                            SELECT phylum
                            FROM treatments
                            WHERE deleted = 0 AND treatmentId = @treatmentId
                        )`
                    ],
                    sortBy: {},
                    group: []
                },

                order: {
                    columns: [ 'Count(*) AS num' ],
                    tables: ['treatments'],
                    constraint: [
                        'deleted = 0',
                        `"order" = (
                            SELECT "order"
                            FROM treatments
                            WHERE deleted = 0 AND treatmentId = @treatmentId
                        )`
                    ],
                    sortBy: {},
                    group: []
                },

                family: {
                    columns: [ 'Count(*) AS num' ],
                    tables: ['treatments'],
                    constraint: [
                        'deleted = 0',
                        `family = (
                            SELECT family
                            FROM treatments
                            WHERE deleted = 0 AND treatmentId = @treatmentId
                        )`
                    ],
                    sortBy: {},
                    group: []
                },

                genus: {
                    columns: [ 'Count(*) AS num' ],
                    tables: ['treatments'],
                    constraint: [
                        'deleted = 0',
                        `genus = (
                            SELECT genus
                            FROM treatments
                            WHERE deleted = 0 AND treatmentId = @treatmentId
                        )`
                    ],
                    sortBy: {},
                    group: []
                },

                species: {
                    columns: [ 'Count(*) AS num' ],
                    tables: ['treatments'],
                    constraint: [
                        'deleted = 0',
                        `species = (
                            SELECT species
                            FROM treatments
                            WHERE deleted = 0 AND treatmentId = @treatmentId
                        )`
                    ],
                    sortBy: {},
                    group: []
                }

            },

            // related queries are performed when a single resource 
            // is queried by sending a resourceId
            related: {

                treatmentAuthors: {
                    pk: 'treatmentAuthorId',
                    columns: [
                        'treatmentAuthorId', 
                        'treatmentAuthor'
                    ],
                    tables: ['treatmentAuthors'],
                    constraint: ['deleted = 0', 'treatmentId = @treatmentId'],
                    sortBy: {},
                    group: []
                },
            
                bibRefCitations: {
                    pk: 'bibRefCitationId',
                    columns: [
                        'bibRefCitationId', 
                        'refString AS citation'
                    ],
                    tables: ['bibRefCitations'],
                    constraint: ['deleted = 0', 'treatmentId = @treatmentId'],
                    sortBy: {},
                    group: []
                },
                
                materialsCitations: {
                    pk: 'materialsCitationId',
                    columns: [
                        'materialsCitationId', 
                        'treatmentId', 
                        'typeStatus', 
                        'latitude', 
                        'longitude'
                    ],
                    tables: ['materialsCitations'],
                    constraint: [
                        'deleted = 0', 
                        'latitude != ""', 
                        'longitude != ""',
                        'treatmentId = @treatmentId'
                    ],
                    sortBy: {},
                    group: []
                },
                
                figureCitations: {
                    pk: 'figureCitationId',
                    columns: [
                        'figureCitationId', 
                        'captionText', 
                        'httpUri', 
                        'thumbnailUri'
                    ],
                    tables: ['figureCitations'],
                    constraint: ['deleted = 0', 'treatmentId = @treatmentId'],
                    sortBy: {},
                    group: []
                }

            },

            stats: {
                specimens: {
                    columns: ['Sum(specimenCount)'], 
                    tables: [
                        'materialsCitations',
                        'treatments ON materialsCitations.treatmentId = treatments.treatmentId'
                    ],
                    constraint: [
                        'treatments.deleted = 0', 
                        'materialsCitations.deleted = 0', 
                        "specimenCount != ''"
                    ],
                    sortBy: {},
                    group: []
                },
    
                'male specimens': {
                    columns: ['Sum(specimenCountMale)'], 
                    tables: [
                        'materialsCitations',
                        'treatments ON materialsCitations.treatmentId = treatments.treatmentId'
                    ],
                    constraint: [
                        'treatments.deleted = 0',
                        'materialsCitations.deleted = 0',
                        "specimenCountMale != ''"
                    ],
                    sortBy: {},
                    group: []
                },
    
                'female specimens': {
                    columns: ['Sum(specimenCountFemale)'], 
                    tables: [
                        'materialsCitations',
                        'treatments ON materialsCitations.treatmentId = treatments.treatmentId'
                    ],
                    constraint: [
                        'treatments.deleted = 0',
                        'materialsCitations.deleted = 0',
                        "specimenCountFemale != ''"
                    ],
                    sortBy: {},
                    group: []
                },
    
                'treatments with specimens': {
                    columns: ['Count(DISTINCT treatments.treatmentId)'], 
                    tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                    constraint: [
                        'treatments.deleted = 0',
                        'materialsCitations.deleted = 0',
                        "specimenCount != ''"
                    ],
                    sortBy: {},
                    group: []
                },
    
                'treatments with male specimens': {
                    columns: ['Count(DISTINCT treatments.treatmentId)'], 
                    tables: [
                        'materialsCitations',
                        'treatments ON materialsCitations.treatmentId = treatments.treatmentId'
                    ],
                    constraint: [
                        'treatments.deleted = 0', 
                        'materialsCitations.deleted = 0',
                        "specimenCountMale != ''"
                    ],
                    sortBy: {},
                    group: []
                },
    
                'treatments with female specimens': {
                    columns: ['Count(DISTINCT treatments.treatmentId)'], 
                    tables: [
                        'materialsCitations',
                        'treatments ON materialsCitations.treatmentId = treatments.treatmentId'
                    ],
                    constraint: [
                        'treatments.deleted = 0',
                        'materialsCitations.deleted = 0',
                        "specimenCountFemale != ''"
                    ],
                    sortBy: {},
                    group: []
                }
            },

            facets: {

                journalTitle: {
                    columns: [
                        'journalTitle', 
                        'Count(journalTitle) AS c'
                    ],
                    tables: ['treatments'],
                    constraint: [
                        'treatments.deleted = 0',
                        "journalTitle != ''"
                    ],
                    sortBy: {},
                    group: ['journalTitle']
                },

                journalYear: {
                    columns: [
                        'journalYear', 
                        'Count(journalYear) AS c'
                    ],
                    tables: ['treatments'],
                    constraint: [
                        'treatments.deleted = 0',
                        "journalYear != ''"
                    ],
                    sortBy: {},
                    group: ['journalYear']
                },

                status: {
                    columns: [
                        'status', 
                        'Count(status) AS c'
                    ],
                    tables: ['treatments'],
                    constraint: [
                        'treatments.deleted = 0',
                        "status != ''"
                    ],
                    sortBy: {},
                    group: ['status']
                },
                
                rank: {
                    columns: [
                        'treatments.rank', 
                        'Count(treatments.rank) AS c'
                    ],
                    tables: ['treatments'],
                    constraint: [
                        'treatments.deleted = 0', 
                        "treatments.rank != ''"
                    ],
                    sortBy: {},
                    group: ['treatments.rank']
                },

                collectionCode: {
                    columns: [
                        'collectionCode', 
                        'Count(collectionCode) AS c'
                    ],
                    tables: [
                        'materialsCitations', 
                        'treatments ON materialsCitations.treatmentId = treatments.treatmentId'
                    ],
                    constraint: [
                        'materialsCitations.deleted = 0',
                        'treatments.deleted = 0',
                        "collectionCode != ''"
                    ],
                    sortBy: {},
                    group: ['collectionCode']
                }
            }
        }
    },

    treatmentAuthors: {
        pk: 'treatmentAuthorId',

        queries: {

            essential: {
                count: {
                    columns: ['Count(*) as numOfRecords'],
                    tables: ['treatmentAuthors'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },
    
                data: {
                    columns: ['treatmentAuthorId', 'treatmentId', 'treatmentAuthor'],
                    tables: ['treatmentAuthors'],
                    constraint: ['deleted = 0'],
                    sortBy: {
                        columns: ['treatmentAuthor'],
                        defaultSort: {
                            col: 'treatmentAuthor',
                            dir: 'ASC'
                        }
                    },
                    group: [],
                    pagination: true
                }
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    columns: [
                        'treatments.id',
                        'treatments.treatmentId AS treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments',
                        'treatmentAuthors ON treatments.treatmentId = treatmentAuthors.treatmentId'
                    ],
                    constraint: [
                        'treatmentAuthors.deleted = 0',
                        'treatmentAuthorId = @treatmentAuthorId'
                    ],
                    sortBy: {},
                    group: []
                }
            },

            stats: {
                authors: {
                    columns: ['Count(*) AS numOfRecords'], 
                    tables: ['treatmentAuthors'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },
            },
            facets: {}
        }
    },

    figureCitations: {
        pk: 'figureCitationId',

        queries: {

            essential: {
                count: {
                    columns: ['Count(*) as numOfRecords'],
                    tables: ['figureCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },
    
                data: {
                    columns: [
                        'figureCitationId', 
                        'treatmentId', 
                        'captionText', 
                        'httpUri', 
                        'thumbnailUri'
                    ],
                    tables: ['figureCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: [],
                    pagination: true
                }
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    columns: [
                        'treatments.id',
                        'treatments.treatmentId AS treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments',
                        'figureCitations ON treatments.treatmentId = figureCitations.treatmentId'
                    ],
                    constraint: [
                        'figureCitations.deleted = 0',
                        'figureCitationId = @figureCitationId'
                    ],
                    sortBy: {},
                    group: []
                }
            },

            stats: {},
            facets: {}
        }
    },

    treatmentCitations: {
        pk: 'treatmentCitationId',

        queries: {

            essential: {
                count: {
                    columns: ['Count(*) as numOfRecords'],
                    tables: ['treatmentCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },
    
                data: {
                    columns: [
                        'id', 
                        'treatmentCitations.treatmentCitationId', 
                        'treatmentCitations.treatmentId', 
                        'treatmentCitations.refString'
                    ],
                    tables: ['treatmentCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: [],
                    pagination: true
                }
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    columns: [
                        'treatments.id', 
                        'treatments.treatmentId AS treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments', 
                        'treatmentCitations ON treatments.treatmentId = treatmentCitations.treatmentId'],
                    constraint: [
                        'treatmentCitations.deleted = 0',
                        'treatmentCitationId = @treatmentCitationId'
                    ],
                    sortBy: {},
                    group: []
                }
            },

            stats: {},
            facets: {}
        },

    },

    bibRefCitations: {
        pk: 'bibRefCitationId',

        queries: {

            essential: {
                count: {
                    columns: ['Count(*) as numOfRecords'],
                    tables: ['bibRefCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },
    
                data: {
                    columns: [
                        'id', 
                        'bibRefCitations.bibRefCitationId', 
                        'bibRefCitations.treatmentId', 
                        'bibRefCitations.refString AS context', 
                        'type', 
                        'year'
                    ],
                    tables: ['bibRefCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {
                        columns: ['type', 'year'],
                        defaultSort: {
                            col: 'year',
                            dir: 'ASC'
                        }
                    },
                    group: [],
                    pagination: true
                }
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    columns: [
                        'treatments.id', 
                        'treatments.treatmentId AS treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments', 
                        'bibRefCitations ON treatments.treatmentId = bibRefCitations.treatmentId'],
                    constraint: [
                        'bibRefCitations.deleted = 0',
                        'bibRefCitationId = @bibRefCitationId'
                    ],
                    sortBy: {},
                    group: []
                }
            },

            stats: {},
            facets: {
                'count by year': {
                    columns: ['Distinct(year) y', 'Count(year) c'],
                    tables: ['bibRefCitations'],
                    constraint: [
                        'bibRefCitations.deleted = 0',
                        "year != ''"
                    ]
                },
    
                'type of citation': {
                    columns: ['Distinct(type) t', 'Count(type) c'],
                    tables: ['bibRefCitations'],
                    constraint: [
                        'bibRefCitations.deleted = 0',
                        "year != ''"
                    ]
                }
            }
        },

    },

    materialsCitations: {

        pk: 'materialsCitationId',

        queries: {

            essential: {
                count: {
                    columns: ['Count(*) as numOfRecords'],
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },
    
                data: {
                    columns: [
                        'id', 
                        'materialsCitationId', 
                        'treatmentId', 
                        'collectingDate',
                        'collectionCode', 
                        'collectorName',
                        'country',
                        'collectingRegion',
                        'municipality',
                        'county',
                        'stateProvince',
                        'location',
                        'locationDeviation', 
                        'specimenCountFemale', 
                        'specimenCountMale', 
                        'specimenCount', 
                        'specimenCode', 
                        'typeStatus', 
                        'determinerName',
                        'collectingDate', 
                        'collectedFrom', 
                        'collectingMethod', 
                        'latitude', 
                        'longitude', 
                        'elevation', 
                        'httpUri'
                    ],
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: [],
                    pagination: true
                }
            },

            related: {
                treatments: {
                    pk: 'treatmentId',
                    columns: [
                        'treatments.id', 
                        'treatments.treatmentId AS treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments', 
                        'materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId'
                    ],
                    constraint: [
                        'materialsCitations.deleted = 0',
                        'materialsCitationId = @materialsCitationId'
                    ],
                    sortBy: {},
                    group: []
                }
            },

            stats: {
                'collection codes': {
                    columns: ['Count(DISTINCT collectionCode) AS "collection codes"'], 
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },

                'collecting countries': {
                    columns: ['Count(DISTINCT collectingCountry) AS "collecting countries"'], 
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },

                'female specimens': {
                    columns: ['Sum(specimenCountFemale) AS "female specimens"'], 
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },

                'male specimens': {
                    columns: ['Sum(specimenCountMale) AS "male specimens"'], 
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                },

                specimens: {
                    columns: ['Sum(specimenCount) AS specimens'], 
                    tables: ['materialsCitations'],
                    constraint: ['deleted = 0'],
                    sortBy: {},
                    group: []
                }
            },

            facets: {}
        }

    },

    authors: {
        //pk: '',

        queries: {

            essential: {
                //count: {},
    
                data: {
                    columns: ['author'],
                    tables: ['authors'],
                    constraint: ['0 = 0'],
                    sortBy: {},
                    group: [],
                    pagination: false
                }
            },

            // related: {},
            // stats: {},
            // facets: {}
        }
    },

    keywords: {
        //pk: '',

        queries: {

            essential: {
                //count: {},
    
                data: {
                    columns: ['keyword'],
                    tables: ['keywords'],
                    constraint: ['0 = 0'],
                    sortBy: {},
                    group: [],
                    pagination: false
                }
            },

            // related: {},
            // stats: {},
            // facets: {}
        }
    },

    taxa: {
        //pk: '',

        queries: {

            essential: {
                //count: {},
    
                data: {
                    columns: ['taxon'],
                    tables: ['taxa'],
                    constraint: ['0 = 0'],
                    sortBy: {},
                    group: [],
                    pagination: false
                }
            },

            // related: {},
            // stats: {},
            // facets: {}
        }
    },

    families: {
        //pk: '',

        queries: {

            essential: {
                //count: {},
    
                data: {
                    columns: ['family'],
                    tables: ['families'],
                    constraint: ['0 = 0'],
                    sortBy: {},
                    group: [],
                    pagination: false
                }
            },

            // related: {},
            // stats: {},
            // facets: {}
        }
    }
};

//module.exports = qParts;
module.exports = queryParts;