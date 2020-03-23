module.exports = {
    treatments: [
        {
            "plazi": "treatmentId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('document').attr('docId')",
            "definition": "The unique ID of the treatment",
            "queryable": true
        },
        {
            "plazi": "treatmentTitle",
            "zenodo": "title",
            "type": "TEXT",
            "element": "$('document').attr('docTitle')",
            "definition": "Title of the article that contains this treatment",
            "queryable": true
        },
        {
            "plazi": "doi",
            "zenodo": "relatedidentifiers[isPartOf]",
            "type": "TEXT",
            "element": "$('document').attr('ID-DOI')",
            "definition": "DOI of journal article",
            "queryable": false
        },
        {
            "plazi": "zenodoDep",
            "zenodo": "relatedidentifiers[isPartOf]",
            "type": "TEXT",
            "element": "$('document').attr('ID-Zenodo-Dep')",
            "definition": "Zenodo record of journal article",
            "queryable": false
        },
        {
            "plazi": "zoobank",
            "zenodo": "relatedidentifiers[isPartOf]",
            "type": "TEXT",
            "element": "$('document').attr('ID-ZooBank')",
            "definition": "ZooBank ID of journal article",
            "queryable": false
        },
        {
            "plazi": "articleTitle",
            "zenodo": "",
            "type": "TEXT",
            "element": "$('document').attr('masterDocTitle')",
            "definition": "The title of the article in which the treatment occured.",
            "queryable": true
        },
        {
            "plazi": "publicationDate",
            "zenodo": "publicationDate",
            "type": "TEXT",
            "element": "$('mods\\\\:detail[type=pubDate] mods\\\\:number').text()",
            "definition": "The date of the publication of the article. If a complete date is not available (for example, if only the year is available), then the last day of the year is used.",
            "queryable": true
        },
        {
            "plazi": "journalTitle",
            "zenodo": "journal_title",
            "type": "TEXT",
            "element": "$('mods\\\\:relatedItem[type=host] mods\\\\:titleInfo mods\\\\:title').text()",
            "definition": "Title of the journal",
            "queryable": true
        },
        {
            "plazi": "journalYear",
            "zenodo": "journal_year",
            "type": "TEXT",
            "element": "$('mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date').text()",
            "definition": "Year of the journal",
            "queryable": true
        },
        {
            "plazi": "journalVolume",
            "zenodo": "journal_volume",
            "type": "TEXT",
            "element": "$('mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=volume] mods\\\\:number').text()",
            "definition": "Volume of the journal",
            "queryable": true
        },
        {
            "plazi": "journalIssue",
            "zenodo": "journal_issue",
            "type": "TEXT",
            "element": "$('mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:detail[type=issue] mods\\\\:number').text()",
            "definition": "Issue of the journal",
            "queryable": false
        },
        {
            "plazi": "pages",
            "zenodo": "pages",
            "type": "TEXT",
            "element": "$('mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:start').text() + '–' + $('mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:extent[unit=page] mods\\\\:end').text()",
            "definition": "'from' and 'to' pages where the treatment occurs in the article",
            "queryable": false
        },
        {
            "plazi": "authorityName",
            "zenodo": "creators: this should be subject: scientificName authority: dwc http://rs.tdwg.org/dwc/terms/scientificNameAuthorship",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('authorityName')",
            "definition": "The name of the author(s) of the taxon (not necessarily the same as the authors of the journal article, but ommited if same as article authors)",
            "queryable": true
        },
        {
            "plazi": "authorityYear",
            "zenodo": "-",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('authorityYear')",
            "definition": "The year when the taxon name has been published",
            "queryable": false
        },
        {
            "plazi": "kingdom",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('kingdom')",
            "definition": "Higher category of the taxonomicName",
            "queryable": true
        },
        {
            "plazi": "phylum",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('phylum')",
            "definition": "Higher category of the taxonomicName",
            "queryable": true
        },
        {
            "plazi": "order",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('order')",
            "definition": "Higher category of the taxonomicName",
            "queryable": true
        },
        {
            "plazi": "family",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('family')",
            "definition": "Higher category of the taxonomicName",
            "queryable": true
        },
        {
            "plazi": "genus",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('genus')",
            "definition": "Higher category of the taxonomicName",
            "queryable": true
        },
        {
            "plazi": "species",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('species')",
            "definition": "The specific epithet of a Latin Binomen",
            "queryable": true
        },
        {
            "plazi": "status",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('status')",
            "definition": "Descriptor for the taxonomic status proposed by a given treatment (can be: new species, or new combination, or new combination and new synonym)",
            "queryable": true
        },
        {
            "plazi": "taxonomicNameLabel",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicNameLabel').text()",
            "definition": "Taxonomic Name Label, present if the species is a new species",
            "queryable": true
        },
        {
            "plazi": "rank",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('subSubSection[type=nomenclature] taxonomicName').attr('rank')",
            "definition": "The taxonomic rank of the taxon, e.g. species, family.",
            "queryable": true
        },
        {
            "plazi": "fullText",
            "zenodo": "",
            "type": "TEXT",
            "element": "$('treatment').text()",
            "definition": "Full text of the treatment",
            "queryable": false
        },
        {
            "plazi": "deleted",
            "zenodo": "",
            "type": "INTEGER DEFAULT 0",
            "element": "$('document').attr('deleted')",
            "definition": "1 if the treatment is deleted, 0 if the treatment is active",
            "queryable": true
        }
    ],
    treatmentAuthors: [
        {
            "plazi": "treatmentAuthorId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "chance.guid()",
            "definition": "The unique ID of this treatmentAuthor",
            "queryable": true
        },
        {
            "plazi": "treatmentId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('document').attr('docId')",
            "definition": "The unique ID of the treatment",
            "queryable": true
        },
        {
            "plazi": "treatmentAuthor",
            "zenodo": "creators",
            "type": "TEXT",
            "element": "mods\\\\:namePart",
            "definition": "Authors of article (used if no treatment authority is found)",
            "queryable": true
        },
        {
            "plazi": "deleted",
            "zenodo": "",
            "type": "INTEGER DEFAULT 0",
            "element": "$('document').attr('deleted')",
            "definition": "1 if the treatmentAuthor has been withdrawn, 0 if the treatmentAuthor is active",
            "queryable": true
        }
    ],
    materialsCitations: [
        {
            "plazi": "materialsCitationId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('materialsCitation').attr('id')",
            "definition": "The unique ID of this materialsCitation",
            "queryable": true
        },
        {
            "plazi": "treatmentId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('document').attr('docId')",
            "definition": "The unique ID of the treatment",
            "queryable": true
        },
        {
            "plazi": "collectingDate",
            "zenodo": "date[type=collected] + range parsing",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('collectingDate')",
            "definition": "The data when the specimen has been collected",
            "queryable": true
        },
        {
            "plazi": "collectionCode",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('collectionCode')",
            "definition": "The collection code for a natural history collection",
            "queryable": true
        },
        {
            "plazi": "collectorName",
            "zenodo": "contributor=collector",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('collectorName')",
            "definition": "Person who collected the specimen",
            "queryable": true
        },
        {
            "plazi": "country",
            "previousName": "collectingCountry",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('country')",
            "definition": "Country where the specimen has been collected",
            "queryable": true
        },
        {
            "plazi": "collectingRegion",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('collectingRegion')",
            "definition": "The geographic region where the specimen as been collected",
            "queryable": true
        },
        {
            "plazi": "municipality",
            "previousName": "collectingMunicipality",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('municipality')",
            "definition": "A lower administrative region",
            "queryable": true
        },
        {
            "plazi": "county",
            "previousName": "collectingCounty",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('county')",
            "definition": "A less lower administrative region",
            "queryable": true
        },
        {
            "plazi": "stateProvince",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('stateProvince')",
            "definition": "A less lower administrative region",
            "queryable": true
        },
        {
            "plazi": "location",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('location')",
            "definition": "The collecting location",
            "queryable": true
        },
        {
            "plazi": "locationDeviation",
            "zenodo": "geo_place",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('locationDeviation')",
            "definition": "Distance to the nearest location, e.g. 23km NW from…",
            "queryable": true
        },
        {
            "plazi": "specimenCountFemale",
            "zenodo": "-",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('specimenCount-female')",
            "definition": "The number of female specimens listed",
            "queryable": true
        },
        {
            "plazi": "specimenCountMale",
            "zenodo": "-",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('specimenCount-male')",
            "definition": "The number of male specimens listed",
            "queryable": true
        },
        {
            "plazi": "specimenCount",
            "zenodo": "-",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('specimenCount')",
            "definition": "The number of specimens listed",
            "queryable": true
        },
        {
            "plazi": "specimenCode",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('specimenCode')",
            "definition": "The code for specimen",
            "queryable": true
        },
        {
            "plazi": "typeStatus",
            "zenodo": "subjects",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('typeStatus')",
            "definition": "The nomenclatural status of the specimen, e.g. holotype, paratype",
            "queryable": true
        },
        {
            "plazi": "determinerName",
            "zenodo": "-",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('determinerName')",
            "definition": "Person or agent who identified the specimen",
            "queryable": true
        },
        {
            "plazi": "collectedFrom",
            "zenodo": "-",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('collectedFrom')",
            "definition": "The substrate where the specimen has been collected, e.g. leaf, flower",
            "queryable": true
        },
        {
            "plazi": "collectingMethod",
            "zenodo": "description[method]",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('collectingMethod')",
            "definition": "The method used to collect the specimen",
            "queryable": true
        },
        {
            "plazi": "latitude",
            "zenodo": "geo_lat",
            "type": "REAL",
            "element": "$('materialsCitation').attr('latitude')",
            "definition": "Geographic coordinates where the specimen has been collected",
            "queryable": true
        },
        {
            "plazi": "longitude",
            "zenodo": "geo_lon",
            "type": "REAL",
            "element": "$('materialsCitation').attr('longitude')",
            "definition": "Geographic coordinates where the specimen has been collected",
            "queryable": true
        },
        {
            "plazi": "elevation",
            "zenodo": "-",
            "type": "REAL",
            "element": "$('materialsCitation').attr('elevation')",
            "definition": "The elevation where the specimen has been collected",
            "queryable": true
        },
        {
            "plazi": "httpUri",
            "zenodo": "relatedIdentifiers[hasPart]",
            "type": "TEXT",
            "element": "$('materialsCitation').attr('httpUri')",
            "definition": "The persistent identifier of the specimen"
        },
        {
            "plazi": "deleted",
            "zenodo": "",
            "type": "INTEGER DEFAULT 0",
            "element": "$('materialsCitation').attr('deleted')",
            "definition": "1 if the materialsCitation is deleted, 0 if the materialsCitation is active",
            "queryable": true
        }
    ],
    treatmentCitations: [
        {
            "plazi": "treatmentCitationId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "chance.guid()",
            "definition": "The unique ID of this treatmentCitation",
            "queryable": true
        },
        {
            "plazi": "treatmentId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('document').attr('docId')",
            "definition": "The unique ID of the treatment",
            "queryable": true
        },
        {
            "plazi": "treatmentCitation",
            "zenodo": "subjects; AND if there is a DOI for the treatmentCitation, relatedIdentifiers[cites];",
            "type": "TEXT",
            "element": "$('subSubSection[type=reference_group] treatmentCitationGroup taxonomicName').text() + ' ' + $('subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName').attr('authority') + ' sec. ' + $('subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation').text()",
            "definition": "The taxonomic name and the author of the species, plus the author of the treatment being cited."
        },
        {
            "plazi": "refString",
            "zenodo": "references",
            "type": "TEXT",
            "element": "$('subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation').attr('refString')",
            "definition": "The bibliographic reference string of the treatments cited by this treatment"
        },
        {
            "plazi": "deleted",
            "zenodo": "",
            "type": "INTEGER DEFAULT 0",
            "element": "$('treatmentCitation').attr('deleted')",
            "definition": "1 if the treatmentCitation has been withdrawn, 0 if the treatmentCitation is active",
            "queryable": true
        }
    ],
    figureCitations: [
        {
            "plazi": "figureCitationId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('figureCitation').attr('id')",
            "definition": "The unique ID of this figureCitation",
            "queryable": true
        },
        {
            "plazi": "treatmentId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('document').attr('docId')",
            "definition": "The unique ID of the treatment",
            "queryable": true
        },
        {
            "plazi": "captionText",
            "zenodo": "relatedIdentifiers[cites]",
            "type": "TEXT",
            "element": "$('figureCitation').attr('captionText')",
            "definition": "The figure cited by this treatment"
        },
        {
            "plazi": "httpUri",
            "zenodo": "relatedIdentifiers[cites]",
            "type": "TEXT",
            "element": "$('figureCitation').attr('httpUri')",
            "definition": "The figure cited by this treatment"
        },
        {
            "plazi": "thumbnailUri",
            "zenodo": "",
            "type": "TEXT",
            "element": "",
            "definition": "The thumbnail of the figure cited by this treatment"
        },
        {
            "plazi": "deleted",
            "zenodo": "",
            "type": "INTEGER DEFAULT 0",
            "element": "$('figureCitation').attr('deleted')",
            "definition": "1 if the figureCitations is deleted, 0 if the figureCitations is valid",
            "queryable": true
        }
    ],
    bibRefCitations: [
        {
            "plazi": "bibRefCitationId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('bibRefCitation').attr('id')",
            "definition": "The unique ID of this bibRefCitation",
            "queryable": true
        },
        {
            "plazi": "treatmentId",
            "zenodo": "",
            "type": "TEXT NOT NULL UNIQUE",
            "element": "$('document').attr('docId')",
            "definition": "The unique ID of the treatment",
            "queryable": true
        },
        {
            "plazi": "refString",
            "zenodo": "relatedIdentifiers[cites]",
            "type": "TEXT",
            "element": "$('bibRefCitation').attr('refString')",
            "definition": "The reference cited by this treatment"
        },
        {
            "plazi": "type",
            "zenodo": "relatedIdentifiers[cites]",
            "type": "TEXT",
            "element": "$('bibRefCitation').attr('type')",
            "definition": "The type of reference cited by this treatment"
        },
        {
            "plazi": "year",
            "zenodo": "relatedIdentifiers[cites]",
            "type": "TEXT",
            "element": "$('bibRefCitation').attr('year')",
            "definition": "The year of the reference cited by this treatment"
        },
        {
            "plazi": "deleted",
            "zenodo": "",
            "type": "INTEGER DEFAULT 0",
            "element": "$('bibRefCitation').attr('deleted')",
            "definition": "1 if the bibRefCitation is deleted, 0 if the bibRefCitation is valid",
            "queryable": true
        }
    ]
    // vernacularNames: [
    //     {"plazi": "vernacularName", "zenodo": "", "type": "string", "element": "@.each().text()","definition": ""}
    // ],
};