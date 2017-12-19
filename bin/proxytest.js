const Wreck = require('wreck');

let page = 1;
let size = 30;
let q = 'nymphalidae';
q = 'gobbledegood';
let imagesOfRecords = {};

const getImages3 = async function(uri) {
    const { res, payload } = await Wreck.get(uri);
    const contents = JSON.parse(payload.toString()).contents;
    imagesOfRecords[uri] = contents.map(function(el) {
        return el.links.self; 
    });
};

const getImages2 = async function(record) {
    const { res, payload } = await Wreck.get(record.links.self);
    const bucket = JSON.parse(payload.toString()).links.bucket;
    await getImages3(bucket);
};

const getImages = async function (uri) {
    
    const {res, payload} =  await Wreck.get(uri);
    const result = JSON.parse(payload.toString()).hits;
    const numOfFoundRecords = result.total;

    if (numOfFoundRecords) {
        console.log(`found ${numOfFoundRecords} records for "${q}"`);
        console.log(`now finding the images for records ${page} to ${page - 1 + size}…`);

        const foundRecords = result.hits.map(getImages2);

        const done = Promise.all(foundRecords);
        done.then(function() {
            console.log(imagesOfRecords);
        });
    }
    else {
        console.log(`nothing found for "${q}"`);
    }
};

const uri = `https://www.zenodo.org/api/records/?communities=biosyslit&q=${q}&type=image&size=${size}&page=${page}`;

try {
    getImages(uri);
}
catch (error) {
    console.error(error);
}