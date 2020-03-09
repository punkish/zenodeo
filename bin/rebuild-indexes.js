'use strict';

const config = require('config');
const Database = require('better-sqlite3');
const db = new Database(config.get('data.treatments'));

const oldIndexes = [
    'ix_treatments_deleted',
    'ix_treatmentAuthors_treatmentAuthorId',
    'ix_treatmentAuthors_treatmentId',
    'ix_treatmentAuthors_treatmentAuthor',
    'ix_treatmentAuthors_deleted',
    'ix_materialsCitations_materialsCitationId',
    'ix_materialsCitations_treatmentId',
    'ix_materialsCitations_collectingDate',
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
    'ix_bibRefCitations_bibRefCitationId',
    'ix_bibRefCitations_treatmentId',
    'ix_bibRefCitations_deleted',
    'ix_treatments_kingdom_phylum',
    'ix_treatments_kingdom_phylum_order',
    'ix_treatments_kingdom_phylum_order_family',
    'ix_treatments_kingdom_phylum_order_family_genus',
    'ix_treatments_kingdom_phylum_order_family_genus_species',
    'ix_treatments_facets',
    'ix_figureCitations_figureCitationId',
    'ix_treatments_kingdom',
    'ix_treatments_phylum ',
    'ix_treatments_order  ',
    'ix_treatments_family ',
    'ix_treatments_genus  ',
    'ix_treatments_species',
    'ix_treatments_status ',
    'ix_treatments_rank   ',
    'ix_treatments_taxonomicNameLabel',
    'ix_treatments_treatmentId       ',
    'ix_treatments_journalTitle',
    'ix_treatments_journalYear',
    'ix_materialsCitations_collectionCode'
];

const newIndexes = [

    /**** treatments **************/
    'CREATE INDEX ix_treatments_treatmentId        ON treatments (deleted, treatmentId)        WHERE deleted = 0',
    'CREATE INDEX ix_treatments_treatmentTitle     ON treatments (deleted, treatmentTitle)     WHERE deleted = 0',
    'CREATE INDEX ix_treatments_articleTitle       ON treatments (deleted, articleTitle)       WHERE deleted = 0',
    'CREATE INDEX ix_treatments_publicationDate    ON treatments (deleted, publicationDate)    WHERE deleted = 0',
    'CREATE INDEX ix_treatments_journalTitle       ON treatments (deleted, journalTitle)       WHERE deleted = 0',
    'CREATE INDEX ix_treatments_journalYear        ON treatments (deleted, journalYear)        WHERE deleted = 0',
    'CREATE INDEX ix_treatments_authorityName      ON treatments (deleted, authorityName)      WHERE deleted = 0',
    'CREATE INDEX ix_treatments_taxonomicNameLabel ON treatments (deleted, taxonomicNameLabel) WHERE deleted = 0',
    'CREATE INDEX ix_treatments_kingdom            ON treatments (deleted, kingdom)            WHERE deleted = 0',
    'CREATE INDEX ix_treatments_phylum             ON treatments (deleted, phylum)             WHERE deleted = 0',
    'CREATE INDEX ix_treatments_order              ON treatments (deleted, "order")            WHERE deleted = 0',
    'CREATE INDEX ix_treatments_family             ON treatments (deleted, family)             WHERE deleted = 0',
    'CREATE INDEX ix_treatments_genus              ON treatments (deleted, genus)              WHERE deleted = 0',
    'CREATE INDEX ix_treatments_species            ON treatments (deleted, species)            WHERE deleted = 0',
    'CREATE INDEX ix_treatments_status             ON treatments (deleted, status)             WHERE deleted = 0',
    'CREATE INDEX ix_treatments_rank               ON treatments (deleted, rank)               WHERE deleted = 0',
    'CREATE INDEX ix_treatments_k_phylum           ON treatments (deleted, kingdom, phylum)    WHERE deleted = 0',
    'CREATE INDEX ix_treatments_k_p_order          ON treatments (deleted, kingdom, phylum, "order") WHERE deleted = 0',
    'CREATE INDEX ix_treatments_k_p_o_family       ON treatments (deleted, kingdom, phylum, "order", family) WHERE deleted = 0',
    'CREATE INDEX ix_treatments_k_p_o_f_genus      ON treatments (deleted, kingdom, phylum, "order", family, genus) WHERE deleted = 0',
    'CREATE INDEX ix_treatments_k_p_o_f_g_species  ON treatments (deleted, kingdom, phylum, "order", family, genus, species) WHERE deleted = 0',
    'CREATE INDEX ix_treatments_facets             ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank) WHERE deleted = 0',
    'CREATE INDEX ix_treatments_deleted            ON treatments (deleted)                     WHERE deleted = 0',
    
    /**** treatmentAuthors **************/
    'CREATE INDEX ix_treatmentAuthors_treatmentAuthorId ON treatmentAuthors (deleted, treatmentAuthorId) WHERE deleted = 0',
    'CREATE INDEX ix_treatmentAuthors_treatmentId       ON treatmentAuthors (deleted, treatmentId) WHERE deleted = 0',
    'CREATE INDEX ix_treatmentAuthors_treatmentAuthor   ON treatmentAuthors (deleted, treatmentAuthor) WHERE deleted = 0',
    'CREATE INDEX ix_treatmentAuthors_deleted           ON treatmentAuthors (deleted) WHERE deleted = 0',
    
    /**** materialsCitations **************/
    'CREATE INDEX ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_collectionCode      ON materialsCitations (deleted, deleted, collectionCode) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_country             ON materialsCitations (deleted, country) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_county              ON materialsCitations (deleted, county) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_location            ON materialsCitations (deleted, location) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation) WHERE deleted = 0',
    'CREATE INDEX ix_materialsCitations_deleted             ON materialsCitations (deleted) WHERE deleted = 0',
    
    /**** treatmentCitations **************/
    'CREATE INDEX ix_treatmentCitations_treatmentCitationId ON treatmentCitations (deleted, treatmentCitationId) WHERE deleted = 0',
    'CREATE INDEX ix_treatmentCitations_treatmentId         ON treatmentCitations (deleted, treatmentId) WHERE deleted = 0',
    'CREATE INDEX ix_treatmentCitations_deleted             ON treatmentCitations (deleted) WHERE deleted = 0',
    
    /**** figureCitations **************/
    'CREATE INDEX ix_figureCitations_treatmentId            ON figureCitations (deleted, treatmentId) WHERE deleted = 0',
    'CREATE INDEX ix_figureCitations_figureCitationId       ON figureCitations (deleted, figureCitationId, treatmentId) WHERE deleted = 0',
    
    /**** bibRefCitations **************/
    'CREATE INDEX ix_bibRefCitations_bibRefCitationId       ON bibRefCitations (deleted, bibRefCitationId) WHERE deleted = 0',
    'CREATE INDEX ix_bibRefCitations_treatmentId            ON bibRefCitations (deleted, treatmentId) WHERE deleted = 0',
    'CREATE INDEX ix_bibRefCitations_deleted                ON bibRefCitations (deleted) WHERE deleted = 0',
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