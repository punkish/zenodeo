'use strict';

const config = require('config');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));

const oldIndexes = [
    'ix_treatments_treatmentId',
    'ix_treatments_treatmentTitle',
    'ix_treatments_articleTitle',
    'ix_treatments_publicationDate',
    'ix_treatments_journalTitle',
    'ix_treatments_journalYear',
    'ix_treatments_authorityName',
    'ix_treatments_taxonomicNameLabel',
    'ix_treatments_kingdom',
    'ix_treatments_phylum',
    'ix_treatments_order',
    'ix_treatments_family',
    'ix_treatments_genus',
    'ix_treatments_species',
    'ix_treatments_status',
    'ix_treatments_rank',
    'ix_treatments_k_phylum',
    'ix_treatments_k_p_order',
    'ix_treatments_k_p_o_family',
    'ix_treatments_k_p_o_f_genus',
    'ix_treatments_k_p_o_f_g_species',
    'ix_treatments_facets',          
    'ix_treatments_deleted',  
    'ix_treatmentAuthors_treatmentAuthorId',
    'ix_treatmentAuthors_treatmentId',
    'ix_treatmentAuthors_treatmentAuthor',
    'ix_treatmentAuthors_deleted',
    'ix_materialsCitations_materialsCitationId',
    'ix_materialsCitations_treatmentId',
    'ix_materialsCitations_collectingDate',
    'ix_materialsCitations_collectionCode',
    'ix_materialsCitations_collectorName',
    'ix_materialsCitations_country',
    'ix_materialsCitations_collectingRegion',
    'ix_materialsCitations_municipality',
    'ix_materialsCitations_county',
    'ix_materialsCitations_stateProvince',
    'ix_materialsCitations_location',
    'ix_materialsCitations_locationDeviation',
    'ix_materialsCitations_specimenCountFemale',
    'ix_materialsCitations_specimenCountMale',
    'ix_materialsCitations_specimenCount',
    'ix_materialsCitations_specimenCode',
    'ix_materialsCitations_typeStatus',
    'ix_materialsCitations_determinerName',
    'ix_materialsCitations_collectedFrom',
    'ix_materialsCitations_collectingMethod',
    'ix_materialsCitations_latitude',
    'ix_materialsCitations_longitude',
    'ix_materialsCitations_elevation',
    'ix_materialsCitations_deleted',
    'ix_treatmentCitations_treatmentCitationId',
    'ix_treatmentCitations_treatmentId',
    'ix_treatmentCitations_deleted',
    'ix_figureCitations_treatmentId',
    'ix_figureCitations_figureCitationId',
    'ix_bibRefCitations_bibRefCitationId',
    'ix_bibRefCitations_treatmentId',
    'ix_bibRefCitations_deleted'
];

const newIndexes = [

    /**** treatments **************/
    'CREATE INDEX ix_treatments_treatmentId        ON treatments (deleted, treatmentId)',

    //CREATE INDEX treatments_idx_015068aa ON treatments(deleted, authorityName COLLATE NOCASE);

    'CREATE INDEX ix_treatments_treatmentTitle     ON treatments (deleted, treatmentTitle COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_articleTitle       ON treatments (deleted, articleTitle COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_publicationDate    ON treatments (deleted, publicationDate)',
    'CREATE INDEX ix_treatments_journalTitle       ON treatments (deleted, journalTitle COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_journalYear        ON treatments (deleted, journalYear)',
    'CREATE INDEX ix_treatments_authorityName      ON treatments (deleted, authorityName COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_taxonomicNameLabel ON treatments (deleted, taxonomicNameLabel COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_kingdom            ON treatments (deleted, kingdom COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_phylum             ON treatments (deleted, phylum COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_order              ON treatments (deleted, "order" COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_family             ON treatments (deleted, family COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_genus              ON treatments (deleted, genus COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_species            ON treatments (deleted, species COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_status             ON treatments (deleted, status COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_rank               ON treatments (deleted, rank COLLATE NOCASE)',
    'CREATE INDEX ix_treatments_k_phylum           ON treatments (deleted, kingdom, phylum)',
    'CREATE INDEX ix_treatments_k_p_order          ON treatments (deleted, kingdom, phylum, "order")',
    'CREATE INDEX ix_treatments_k_p_o_family       ON treatments (deleted, kingdom, phylum, "order", family)',
    'CREATE INDEX ix_treatments_k_p_o_f_genus      ON treatments (deleted, kingdom, phylum, "order", family, genus)',
    'CREATE INDEX ix_treatments_k_p_o_f_g_species  ON treatments (deleted, kingdom, phylum, "order", family, genus, species)',
    'CREATE INDEX ix_treatments_facets             ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)',
    'CREATE INDEX ix_treatments_deleted            ON treatments (deleted)',
    
    /**** treatmentAuthors **************/
    'CREATE INDEX ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (deleted, treatmentAuthorId)',
    'CREATE INDEX ix_treatmentAuthors_treatmentId       ON treatmentAuthors (deleted, treatmentId)',
    'CREATE INDEX ix_treatmentAuthors_treatmentAuthor   ON treatmentAuthors (deleted, treatmentAuthor COLLATE NOCASE)',
    'CREATE INDEX ix_treatmentAuthors_deleted           ON treatmentAuthors (deleted)',
    
    /**** materialsCitations **************/
    'CREATE INDEX ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)',
    'CREATE INDEX ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)',
    'CREATE INDEX ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)',
    'CREATE INDEX ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)',
    'CREATE INDEX ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)',
    'CREATE INDEX ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)',
    'CREATE INDEX ix_materialsCitations_deleted             ON materialsCitations (deleted)',
    
    /**** treatmentCitations **************/
    'CREATE INDEX ix_treatmentCitations_treatmentCitationId ON treatmentCitations (deleted, treatmentCitationId)',
    'CREATE INDEX ix_treatmentCitations_treatmentId         ON treatmentCitations (deleted, treatmentId)',
    'CREATE INDEX ix_treatmentCitations_treatmentCitation   ON treatmentCitations (deleted, treatmentCitation COLLATE NOCASE)',
    'CREATE INDEX ix_treatmentCitations_refString           ON treatmentCitations (deleted, refString COLLATE NOCASE)',
    'CREATE INDEX ix_treatmentCitations_deleted             ON treatmentCitations (deleted)',
    
    /**** figureCitations **************/
    'CREATE INDEX ix_figureCitations_treatmentId            ON figureCitations (deleted, treatmentId)',
    'CREATE INDEX ix_figureCitations_figureCitationId       ON figureCitations (deleted, figureCitationId, treatmentId)',
    
    /**** bibRefCitations **************/
    'CREATE INDEX ix_bibRefCitations_bibRefCitationId       ON bibRefCitations (deleted, bibRefCitationId)',
    'CREATE INDEX ix_bibRefCitations_treatmentId            ON bibRefCitations (deleted, treatmentId)',
    'CREATE INDEX ix_bibRefCitations_year                   ON bibRefCitations (deleted, year)',
    'CREATE INDEX ix_bibRefCitations_deleted                ON bibRefCitations (deleted)',
]

const dropIndexes = function(ixArray) {
    ixArray.forEach(i => {
        const sql = `DROP INDEX ${i}`;
        console.log(`dropping ${i}`);
        try {
           db.prepare(sql).run();
        }
        catch (error) {
            console.error(error);
        }
    })
}

dropIndexes(oldIndexes)

const createIndexes = function(ixArray) {
    ixArray.forEach(i => {
        console.log(`${i}`);
        try {
           db.prepare(i).run();
        }
        catch (error) {
            console.error(error);
        }
    })
}

createIndexes(newIndexes)