'use strict';

const dd = {
    treatments: [
        {
             plaziName: "treatmentId",
            zenodoName: "",
               sqlType: "TEXT NOT NULL UNIQUE",
        cheerioElement: "$('document').attr('docId')",
           description: "The unique ID of the treatment",
             queryable: equal,
            resourceId: true
        },
        {
             plaziName: "treatmentTitle",
            zenodoName: "title",
               sqlType: "TEXT",
        cheerioElement: "$('document').attr('docTitle')",
           description: "Title of the article that contains this treatment",
             queryable: true,
            resourceId: false
        },
        {
            plaziName: 
            zenodoName: 
               sqlType: 
        cheerioElement: 
           description: 
             queryable: 
            resourceId: 
            plazi": "doi",
            zenodo": "relatedidentifiers[isPartOf]",
            type": "TEXT",
            element": "$('document').attr('ID-DOI')",
            definition": "DOI of journal article",
            queryable": false
        },
        {
            plaziName: 
            zenodoName: 
               sqlType: 
        cheerioElement: 
           description: 
             queryable: 
            resourceId: 
            plazi": "zenodoDep",
            zenodo": "relatedidentifiers[isPartOf]",
            type": "TEXT",
            element": "$('document').attr('ID-Zenodo-Dep')",
            definition": "Zenodo record of journal article",
            queryable": false
        },
    ]
};