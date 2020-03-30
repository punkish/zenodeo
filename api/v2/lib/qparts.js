'use strict';

const qParts = {
    treatments: {
        pk: 'treatmentId',

        // columns that can be queried with the respective
        // SQL operators '=', 'LIKE' and 'MATCH
        queryable: {
            equal: {
                treatmentId: '',
                publicationDate: '', 
                journalYear: '', 
                journalVolume: '', 
                journalIssue: '', 
                authorityYear: ''
            },
            like: {
                treatmentTitle: '', 
                articleTitle: '', 
                journalTitle: '', 
                authorityName: '', 
                taxonomicNameLabel: '',
                kingdom: '', 
                phylum: '', 
                order: '"order"', 
                family: '', 
                genus: '', 
                species: '', 
                status: '', 
                rank: 'treatments.rank'
            },

            // 'MATCH' is used for full-text search. The search term is 
            // submitted via 'q'. The entire table is used in the MATCH
            // expression like so
            //
            // vtreatments MATCH @q
            match: {
                q: { 
                    column: 'vtreatments', 
                    table: 'vtreatments ON treatments.treatmentId = vtreatments.treatmentId' 
                }
            }
        },

        queries: {

            // 'count' and 'data' queries are always performed for all 
            // queries
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
                    pagination: true
                }
            },

            related: {
                treatmentAuthors: {
                    pk: 'treatmentAuthorId',
                    columns: [
                        'treatmentAuthorId', 
                        'treatmentAuthor'
                    ],
                    tables: ['treatmentAuthors'],
                    constraint: ['deleted = 0'],
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
                    constraint: ['deleted = 0'],
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
                        'longitude != ""'
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
                    constraint: ['deleted = 0'],
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
                        'specimenCount != ""'
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
                        'specimenCountMale != ""'
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
                        'materialsCitations.deleted = 0 AND specimenCountFemale != ""'
                    ],
                    sortBy: {},
                    group: []
                },
    
                'treatments with specimens': {
                    columns: ['Count(DISTINCT treatments.treatmentId)'], 
                    tables: ['materialsCitations JOIN treatments ON materialsCitations.treatmentId = treatments.treatmentId'],
                    constraint: ["treatments.deleted = 0 AND materialsCitations.deleted = 0 AND specimenCount != ''"],
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
                        'materialsCitations.deleted = 0 AND specimenCountMale != ""'
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
                        'materialsCitations.deleted = 0 AND specimenCountFemale != ""'
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
                        'journalTitle != ""'
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
                        'journalYear != ""'
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
                        'status != ""'
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
                        'treatments.rank != ""'
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
                        'collectionCode != ""',
                        'materialsCitations.deleted = 0',
                        'treatments.deleted = 0'
                    ],
                    sortBy: {},
                    group: ['collectionCode']
                }
            }
        }
    },

    treatmentAuthors: {
        pk: 'treatmentAuthorId',

        // columns that can be queried with the respective
        // SQL operators '=', 'LIKE' and 'MATCH
        queryable: {
            equal: {
                treatmentAuthorId: '',
                treatmentId: ''
            },
            like: {
                treatmentAuthor: ''
            },
            match: {}
        },

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
                        'treatments.treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments',
                        'treatmentAuthors ON treatments.treatmentId = treatmentAuthors.treatmentId'
                    ],
                    constraint: [],
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

        // columns that can be queried with the respective
        // SQL operators '=', 'LIKE' and 'MATCH
        queryable: {
            equal: {
                figureCitationId: '',
                treatmentId: ''
            },
            like: {},
            match: {
                q: { 
                    column: 'vfigurecitations', 
                    table: 'vfigurecitations ON figureCitations.figureCitationId = vfigurecitations.figureCitationId' 
                }
            }
        },

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
                        'treatments.treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments',
                        'figureCitations ON treatments.treatmentId = figureCitations.treatmentId'
                    ],
                    constraint: [],
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

        // columns that can be queried with the respective
        // SQL operators '=', 'LIKE' and 'MATCH
        queryable: {
            equal: {
                treatmentCitationId: '',
                treatmentId: ''
            },
            like: {
                treatmentCitation: '',
                refString: ''
            },
            match: {}
        },

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
                        'treatments.treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments', 
                        'bibRefCitations b ON treatments.treatmentId = b.treatmentId'],
                    constraint: [],
                    sortBy: {},
                    group: []
                }
            },

            stats: {},
            facets: {}
        },

    },

    citations: {
        pk: 'bibRefCitationId',

        // columns that can be queried with the respective
        // SQL operators '=', 'LIKE' and 'MATCH
        queryable: {
            equal: {
                bibRefCitationId: '',
                treatmentId: '',
                year: ''
            },
            like: {},
            match: {
                q: { 
                    column: 'vbibRefCitations', 
                    table: 'vbibRefCitations v ON bibRefCitations.bibRefCitationId = v.bibRefCitationId' 
                }
            }
        },

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
                        'treatments.treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments', 
                        'bibRefCitations b ON treatments.treatmentId = b.treatmentId'],
                    constraint: [],
                    sortBy: {},
                    group: []
                }
            },

            stats: {},
            facets: {
                'count by year': {
                    columns: ['Distinct(year) y', 'Count(year) c'],
                    tables: ['bibRefCitations'],
                    constraint: ['bibRefCitations.deleted = 0 AND year != ""']
                },
    
                'type of citation': {
                    columns: ['Distinct(type) t', 'Count(type) c'],
                    tables: ['bibRefCitations'],
                    constraint: ['bibRefCitations.deleted = 0 AND year != ""']
                }
            }
        },

    },

    materialsCitations: {

        pk: 'materialsCitationId',

        // columns that can be queried with the respective
        // SQL operators '=', 'LIKE' and 'MATCH
        queryable: {
            equal: {
                materialsCitationId: '',
                treatmentId: ''
            },
            like: {
                collectingDate: '',
                collectionCode: '', 
                collectorName: '',
                country: '',
                collectingRegion: '',
                municipality: '',
                county: '',
                stateProvince: '',
                location: '',
                locationDeviation: '', 
                specimenCountFemale: '', 
                specimenCountMale: '', 
                specimenCount: '', 
                specimenCode: '', 
                typeStatus: '', 
                determinerName: '',
                collectingDate: '', 
                collectedFrom: '', 
                collectingMethod: ''
            },
            match: {}
        },

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
                        'treatments.treatmentId', 
                        'treatmentTitle', 
                        'authorityName || ". " || authorityYear || ". <i>" || articleTitle || ".</i> " || journalTitle || ", " || journalYear || ", pp. " || pages || ", vol. " || journalVolume || ", issue " || journalIssue AS context'
                    ],
                    tables: [
                        'treatments', 
                        'materialsCitations m ON treatments.treatmentId = m.treatmentId'
                    ],
                    constraint: [],
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

    }
};

module.exports = qParts;