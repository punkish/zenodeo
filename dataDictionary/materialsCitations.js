'use strict';

module.exports = [
    {
        plaziName     : 'id',
        zenodoName    : '',
        sqlType       : 'INTEGER PRIMARY KEY',
        cheerioElement: '',
        description   : 'pk',
        queryable     : '',
        queryString   : '',
        validation    : '',
        resourceId    : false
    },
    {
        plaziName     : 'materialsCitationId',
        zenodoName    : '',
        sqlType       : 'TEXT NOT NULL UNIQUE',
        cheerioElement: '$("materialsCitation").attr("id")',
        description   : 'The unique ID of the materialsCitation',
        queryable     : 'equal',
        queryString   : 'materialsCitationId',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : true
    },
    {
        plaziName     : 'collectingDate',
        zenodoName    : 'date[type=collected] + range parsing',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("collectingDate")',
        description   : 'The date when the specimen was collected',
        queryable     : 'equal',
        queryString   : 'collectingDate',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'collectionCode',
        zenodoName    : 'subjects',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("collectionCode")',
        description   : 'The collection code for a natural history collection',
        queryable     : 'equal',
        queryString   : 'collectionCode',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'collectorName',
        zenodoName    : 'contributor=collector',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("collectorName")',
        description   : 'The person who collected the specimen',
        queryable     : 'like',
        queryString   : 'collectorName',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'country',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("country")',
        description   : 'The country where the specimen was collected',
        queryable     : 'like',
        queryString   : 'country',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'collectingRegion',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("collectingRegion")',
        description   : 'The geographic region where the specimen was collected',
        queryable     : 'like',
        queryString   : 'collectingRegion',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'municipality',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("municipality")',
        description   : 'A lower administrative region',
        queryable     : 'like',
        queryString   : 'municipality',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'county',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("county")',
        description   : 'The county where the specimen was collected',
        queryable     : 'like',
        queryString   : 'county',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'stateProvince',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("stateProvince")',
        description   : 'The state or province where the specimen was collected',
        queryable     : 'like',
        queryString   : 'stateProvince',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'location',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("location")',
        description   : 'The location where the specimen was collected',
        queryable     : 'like',
        queryString   : 'location',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'locationDeviation',
        zenodoName    : 'geo_place',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("locationDeviation")',
        description   : 'The distance to the nearest location, e.g. 23km NW from…',
        queryable     : '',
        queryString   : '',
        validation    : '',
        resourceId    : false
    },
    {
        plaziName     : 'specimenCountFemale',
        zenodoName    : '',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("specimenCount-female")',
        description   : 'The number of listed female specimens',
        queryable     : '',
        queryString   : '',
        validation    : '',
        resourceId    : false
    },
    {
        plaziName     : 'specimenCountMale',
        zenodoName    : '',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("specimenCount-male")',
        description   : 'The number of listed male specimens',
        queryable     : '',
        queryString   : '',
        validation    : '',
        resourceId    : false
    },
    {
        plaziName     : 'specimenCount',
        zenodoName    : '',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("specimenCount")',
        description   : 'The number of listed specimens',
        queryable     : '',
        queryString   : '',
        validation    : '',
        resourceId    : false
    },
    {
        plaziName     : 'specimenCode',
        zenodoName    : 'subjects',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("specimenCode")',
        description   : 'The code of the specimen',
        queryable     : 'equal',
        queryString   : 'specimenCode',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'typeStatus',
        zenodoName    : 'subjects',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("typeStatus")',
        description   : 'The nomenclatural status of the specimen, e.g. holotype, paratype',
        queryable     : 'equal',
        queryString   : 'typeStatus',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'determinerName',
        zenodoName    : '',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("determinerName")',
        description   : 'The person or agent who identified the specimen',
        queryable     : 'like',
        queryString   : 'determinerName',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'collectedFrom',
        zenodoName    : '',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("collectedFrom")',
        description   : 'The substrate where the specimen has been collected, e.g. leaf, flower',
        queryable     : 'like',
        queryString   : 'collectedFrom',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'collectingMethod',
        zenodoName    : 'description[method]',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("collectingMethod")',
        description   : 'The method used for collecting the specimen',
        queryable     : 'like',
        queryString   : 'collectingMethod',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'latitude',
        zenodoName    : 'geo_lat',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("latitude")',
        description   : 'Geographic coordinates of the location where the specimen was collected',
        queryable     : 'equal',
        queryString   : 'latitude',
        validation    : 'Joi.number().min(-90).max(90).description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'longitude',
        zenodoName    : 'geo_lon',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("longitude")',
        description   : 'Geographic coordinates of the location where the specimen was collected',
        queryable     : 'equal',
        queryString   : 'longitude',
        validation    : 'Joi.number().min(-180).max(180).description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'elevation',
        zenodoName    : '',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("elevation")',
        description   : 'Elevation of the location where the specimen was collected',
        queryable     : 'equal',
        queryString   : 'elevation',
        validation    : 'Joi.string().description(`${d}`).optional()',
        resourceId    : false
    },
    {
        plaziName     : 'httpUri',
        zenodoName    : 'relatedIdentifiers[hasPart]',
        sqlType       : 'TEXT',
        cheerioElement: '$("materialsCitation").attr("httpUri")',
        description   : 'The persistent identifier of the specimen',
        queryable     : '',
        queryString   : '',
        validation    : '',
        resourceId    : false
    }
];