const Package = require('./package.json');

const config = {
    uri: 'https://www.zenodo.org/api/',
    port: 3030,
    info: {
        title: "Zenodeo API documentation for BLR",
        version: "1.5.2",
        description: Package.description,
        termsOfService: "/tos",
        contact: {
            name: Package.author,
            url: "http://punkish.org/About",
            email: "punkish@plazi.org"
        },
        license: {
            name: "CC0 Public Domain Dedication",
            url: "https://creativecommons.org/publicdomain/zero/1.0/legalcode"
        }
    }
};

module.exports = config;