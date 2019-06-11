module.exports = {
    treatments: [{
        "plazi": "treatmentId",
        "zenodo": "",
        "type": "string.guid()",
        "element": "$('document').attr('docId')",
        "definition": "The unique ID of the treatment",
        "queryable": true
    },
    {
        "plazi": "treatmentTitle",
        "zenodo": "title",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').text() + ' ' + $('subSubSection[type=nomenclature] taxonomicName').attr('authority')",
        "definition": "Title of the treatment. If it is a new species, a taxonomicNameLabel will be present, and is concatenated to the taxonomicName, which is concatenated to the authority attribute",
        "queryable": false
    },
    {
        "plazi": "pages",
        "zenodo": "pages",
        "type": "string",
        "element": "$('treatment').attr('pageNumber') + '–' + $('treatment').attr('lastPageNumber')",
        "definition": "'from' and 'to' pages where the treatment occurs in the article",
        "queryable": false
    },
    {
        "plazi": "doi",
        "zenodo": "relatedidentifiers[isPartOf]",
        "type": "string",
        "element": "$('mods\\\\:identifier[type=DOI]').text()",
        "definition": "DOI of journal article",
        "queryable": false
    },
    {
        "plazi": "zenodoDep",
        "zenodo": "relatedidentifiers[isPartOf]",
        "type": "string",
        "element": "$('mods\\\\:identifier[type=Zenodo-Dep]').text()",
        "definition": "Zenodo record of journal article",
        "queryable": false
    },
    {
        "plazi": "publicationDate",
        "zenodo": "publicationDate",
        "type": "date",
        "element": "$('mods\\\\:detail[type=pubDate] mods\\\\:number').text()",
        "definition": "The date of the publication of the article. If a complete date is not available (for example, if only the year is available), then the last day of the year is used.",
        "queryable": true
    },
    {
        "plazi": "journalTitle",
        "zenodo": "journal_title",
        "type": "string",
        "element": "$('mods\\\\:titleInfo').text()",
        "definition": "Title of the journal",
        "queryable": true
    },
    {
        "plazi": "journalYear",
        "zenodo": "journal_year",
        "type": "string",
        "element": "$('mods\\\\:part mods\\\\:date').text()",
        "definition": "Year of the journal",
        "queryable": true
    },
    {
        "plazi": "journalVolume",
        "zenodo": "journal_volume",
        "type": "string",
        "element": "$('mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number').text()",
        "definition": "Volume of the journal",
        "queryable": false
    },
    {
        "plazi": "journalIssue",
        "zenodo": "journal_issue",
        "type": "string",
        "element": "$('mods\\\\:detail[type=issue]').text()",
        "definition": "Issue of the journal",
        "queryable": false
    },
    {
        "plazi": "authorityName",
        "zenodo": "creators: this should be subject: scientificName authority: dwc http://rs.tdwg.org/dwc/terms/scientificNameAuthorship",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('authorityName')",
        "definition": "The name of the author(s) of the taxon (not necessarily the same as the authors of the journal article, but ommited if same as article authors)",
        "queryable": false
    },
    {
        "plazi": "authorityYear",
        "zenodo": "-",
        "type": "year",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('authorityYear')",
        "definition": "The year when the taxon name has been published",
        "queryable": false
    },
    {
        "plazi": "kingdom",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('kingdom')",
        "definition": "Higher category of the taxonomicName",
        "queryable": true
    },
    {
        "plazi": "phylum",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('phylum')",
        "definition": "Higher category of the taxonomicName",
        "queryable": true
    },
    {
        "plazi": "order",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('order')",
        "definition": "Higher category of the taxonomicName",
        "queryable": true
    },
    {
        "plazi": "family",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('family')",
        "definition": "Higher category of the taxonomicName",
        "queryable": true
    },
    {
        "plazi": "genus",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('genus')",
        "definition": "Higher category of the taxonomicName",
        "queryable": true
    },
    {
        "plazi": "species",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('species')",
        "definition": "The specific epithet of a Latin Binomen",
        "queryable": true
    },
    {
        "plazi": "status",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('status')",
        "definition": "Descriptor for the taxonomic status proposed by a given treatment (can be: new species, or new combination, or new combination and new synonym)",
        "queryable": true
    },
    {
        "plazi": "rank",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('rank')",
        "definition": "The taxonomic rank of the taxon, e.g. species, family.",
        "queryable": true
    },
    {
        "plazi": "fullText",
        "zenodo": "",
        "type": "string",
        "element": "$('treatment').text()",
        "definition": "Full text of the treatment",
        "queryable": true
    }],
    treatmentAuthors: [{
        "plazi": "treatmentAuthor",
        "zenodo": "creators",
        "type": "string",
        "element": "mods\\\\:namePart",
        "definition": "Authors of article (used if no treatment authority is found)",
        "queryable": true
    }],
    materialsCitations: [{
        "plazi": "collectionCode",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('materialsCitation').attr('collectionCode')",
        "definition": "The collection code for a natural history collection",
        "queryable": true
    },
    {
        "plazi": "specimenCountFemale",
        "zenodo": "-",
        "type": "string",
        "element": "$('materialsCitation').attr('specimenCount-female')",
        "definition": "The number of female specimens listed",
        "queryable": false
    },
    {
        "plazi": "specimenCountMale",
        "zenodo": "-",
        "type": "string",
        "element": "$('materialsCitation').attr('specimenCount-male')",
        "definition": "The number of male specimens listed",
        "queryable": false
    },
    {
        "plazi": "specimenCount",
        "zenodo": "-",
        "type": "string",
        "element": "$('materialsCitation').attr('specimenCount')",
        "definition": "The number of specimens listed",
        "queryable": false
    },
    {
        "plazi": "specimenCode",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('materialsCitation').attr('specimenCode')",
        "definition": "The code for specimen",
        "queryable": false
    },
    {
        "plazi": "typeStatus",
        "zenodo": "subjects",
        "type": "string",
        "element": "$('materialsCitation').attr('typeStatus')",
        "definition": "The nomenclatural status of the specimen, e.g. holotype, paratype",
        "queryable": true
    },
    {
        "plazi": "collectingCountry",
        "zenodo": "geo_place",
        "type": "string",
        "element": "$('materialsCitation').attr('collectingCountry')",
        "definition": "Country where the specimen has been collected",
        "queryable": true
    },
    {
        "plazi": "collectingRegion",
        "zenodo": "geo_place",
        "type": "string",
        "element": "$('materialsCitation').attr('collectingRegion')",
        "definition": "The geographic region where the specimen as been collected",
        "queryable": true
    },
    {
        "plazi": "collectingMunicipality",
        "zenodo": "geo_place",
        "type": "string",
        "element": "$('materialsCitation').attr('collectingMunicipality')",
        "definition": "A lower administrative region",
        "queryable": true
    },
    {
        "plazi": "collectingCounty",
        "zenodo": "geo_place",
        "type": "string",
        "element": "$('materialsCitation').attr('collectingCounty')",
        "definition": "A less lower administrative region",
        "queryable": true
    },
    {
        "plazi": "location",
        "zenodo": "geo_place",
        "type": "string",
        "element": "$('materialsCitation').attr('location')",
        "definition": "The collecting location",
        "queryable": true
    },
    {
        "plazi": "locationDeviation",
        "zenodo": "geo_place",
        "type": "string",
        "element": "$('materialsCitation').attr('locationDeviation')",
        "definition": "Distance to the nearest location, e.g. 23km NW from…",
        "queryable": true
    },
    {
        "plazi": "determinerName",
        "zenodo": "-",
        "type": "string",
        "element": "$('materialsCitation').attr('determinerName')",
        "definition": "Person or agent who identified the specimen",
        "queryable": true
    },
    {
        "plazi": "collectorName",
        "zenodo": "contributor=collector",
        "type": "string",
        "element": "$('materialsCitation').attr('collectorName')",
        "definition": "Person who collected the specimen",
        "queryable": true
    },
    {
        "plazi": "collectingDate",
        "zenodo": "date[type=collected] + range parsing",
        "type": "string",
        "element": "$('materialsCitation').attr('collectingDate')",
        "definition": "The data when the specimen has been collected",
        "queryable": true
    },
    {
        "plazi": "collectedFrom",
        "zenodo": "-",
        "type": "string",
        "element": "$('materialsCitation').attr('collectedFrom')",
        "definition": "The substrate where the specimen has been collected, e.g. leaf, flower",
        "queryable": true
    },
    {
        "plazi": "collectingMethod",
        "zenodo": "description[method]",
        "type": "string",
        "element": "$('materialsCitation').attr('collectingMethod')",
        "definition": "The method used to collect the specimen",
        "queryable": true
    },
    {
        "plazi": "latitude",
        "zenodo": "geo_lat",
        "type": "latitude",
        "element": "$('materialsCitation').attr('latitude')",
        "definition": "Geographic coordinates where the specimen has been collected",
        "queryable": true
    },
    {
        "plazi": "longitude",
        "zenodo": "geo_lon",
        "type": "longitude",
        "element": "$('materialsCitation').attr('longitude')",
        "definition": "Geographic coordinates where the specimen has been collected",
        "queryable": true
    },
    {
        "plazi": "elevation",
        "zenodo": "-",
        "type": "real",
        "element": "$('materialsCitation').attr('elevation')",
        "definition": "The elevation where the specimen has been collected",
        "queryable": true
    },
    {
        "plazi": "httpUri",
        "zenodo": "relatedIdentifiers[hasPart]",
        "type": "uri",
        "element": "$('materialsCitation').attr('httpUri')",
        "definition": "The persistent identifier of the specimen"
    }],
    treatmentCitations: [{
        "plazi": "treatmentCitation",
        "zenodo": "subjects; AND if there is a DOI for the treatmentCitation, relatedIdentifiers[cites];",
        "type": "string",
        "element": "$('subSubSection[type=reference_group] treatmentCitationGroup taxonomicName').text() + ' ' + $('subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName').attr('authority') + ' sec. ' + $('subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation').text()",
        "definition": "The taxonomic name and the author of the species, plus the author of the treatment being cited."
    },
    {
        "plazi": "refString",
        "zenodo": "references",
        "type": "string",
        "element": "$('subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation').attr('refString')",
        "definition": "The bibliographic reference string of the treatments cited by this treatment"
    }],
    figureCitations: [{
        "plazi": "captionText",
        "zenodo": "relatedIdentifiers[cites]",
        "type": "uri",
        "element": "$('figureCitation')",
        "definition": "The figures cited by this treatment"
    },
    {
        "plazi": "httpUri",
        "zenodo": "relatedIdentifiers[cites]",
        "type": "uri",
        "element": "$('figureCitation')",
        "definition": "The figures cited by this treatment"
    }],
    bibRefCitations: [{
        "plazi": "refString",
        "zenodo": "relatedIdentifiers[cites]",
        "type": "uri",
        "element": "text()",
        "definition": "The figures cited by this treatment"
    }]
    // vernacularNames: [
    //     {"plazi": "vernacularName", "zenodo": "", "type": "string", "element": "@.each().text()","definition": ""}
    // ],
};