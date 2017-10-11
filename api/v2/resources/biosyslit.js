const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');

const biosyslit = {

    method: 'GET',

    path: '/',

    config: {
        description: "biosyslit",
        tags: ['biosyslit', 'communities', 'api'],
        plugins: {
            'hapi-swagger': {
                order: 1,
                responseMessages: ResponseMessages
            }
        },
        validate: {},
        notes: [
            'A community to share publications related to bio-systematics. The goal is to provide open access to publications cited in publications or in combination with scientific names a digital object identifier (DOI) to enable citation of the publications including direct access to its digital representation. For additional search functionality  can be used. This includes also searches in CrossRef, DataCite, PubMed, RefBank, GNUB and Mendeley.',
        ]
    },

    handler: function(request, reply) {
        const uri = Config.uri + 'communities/biosyslit';

        Wreck.get(uri, (err, res, payload) => {

            if (err) {
                reply(err);
                return;
            }

            reply('test v2')
        })
    }
};

module.exports = biosyslit;