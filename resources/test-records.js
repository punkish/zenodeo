const Wreck = require('wreck');
const config = require('../config.js');

const records = [
  "https://www.zenodo.org/api/records/1003060",
  "https://www.zenodo.org/api/records/1003058",
  "https://www.zenodo.org/api/records/1003056",
  "https://www.zenodo.org/api/records/1003054",
  "https://www.zenodo.org/api/records/1003046",
  "https://www.zenodo.org/api/records/1003044",
  "https://www.zenodo.org/api/records/1003042",
  "https://www.zenodo.org/api/records/1003040",
  "https://www.zenodo.org/api/records/1003038",
  "https://www.zenodo.org/api/records/1003036"
];

const getImagesOfOneRecord = function(record) {

    Wreck.get(record, (err, res, payload) => {
        let images = [];
        const bucket = JSON.parse(payload.toString())
            .links
            .bucket;

        Wreck.get(bucket, (err, res, payload) => {
            JSON.parse(payload.toString()).contents.forEach(function(element) {
                images.push(element.links.self);
            });

            console.log(images);
            //reply(images).headers = res.headers;
        });
    })
}

//getImagesOfOneRecord(records[0]);

const getImagesOfManyRecords = function(records) {
    records.forEach(async function(record) {
        getImagesOfOneRecord(record);
    });
}

getImagesOfManyRecords(records);

// let recordsWithImages = {};

// records.forEach(async function (record) {
//     //console.log(record);
//     let images = [];
//     const { res, payload } = await Wreck.get(record);
//     console.log(JSON.parse(payload.toString()));
//     // JSON.parse(payload.toString()).contents.forEach(function(element) {
//     //     images.push(element.links.self);
//     // });
//     // recordsWithImages[record] = images;
// });