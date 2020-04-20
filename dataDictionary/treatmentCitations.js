'use strict';

module.exports = [
    // {
    //     plaziName     : 'id',
    //     zenodoName    : '',
    //     sqlType       : 'INTEGER PRIMARY KEY',
    //     cheerioElement: '',
    //     description   : 'pk',
    //     queryable     : '',
    //     queryString   : '',
    //     validation    : '',
    //     resourceId    : false
    // },
    {
        plaziName     : 'treatmentCitationId',
        zenodoName    : '',
        sqlType       : 'TEXT NOT NULL UNIQUE',
        cheerioElement: '',
        description   : 'The unique ID of the treatmentCitation',
        queryable     : 'equal',
        queryString   : 'treatmentCitationId',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : true
    },
    {
        plaziName     : 'treatmentCitation',
        zenodoName    : 'subjects; AND if there is a DOI for the treatmentCitation, relatedIdentifiers[cites]',
        sqlType       : 'TEXT',
        cheerioElement: '$("subSubSection[type=reference_group] treatmentCitationGroup taxonomicName").text() + " " + $("subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName").attr("authority") + " sec. " + $("subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation").text()',
        description   : 'The taxonomic name and the author of the species, plus the author of the treatment being cited',
        queryable     : '',
        queryString   : '',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'refString',
        zenodoName    : 'relatedIdentifiers[cites]',
        sqlType       : 'TEXT',
        cheerioElement: '$("subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation").attr("refString")',
        description   : 'The bibliographic reference string of the treatments cited by this treatment',
        queryable     : '',
        queryString   : '',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    }
];