const config = {
    uri: 'https://www.zenodo.org/api/',
    port: 3030,
    info: {
        title: 'Zenodo API Documentation for BLR',
        version: "1.0.1",
        description: "`nodejs` interface to Zenodo/BLR community",
        termsOfService: "/tos",
        contact: {
            name: "Puneet Kishor",
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