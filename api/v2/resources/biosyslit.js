const Wreck = require('wreck');
const Config = require('../../../config.js');
const ResponseMessages = require('../../response-messages');

const uri = Config.uri + 'communities/biosyslit';

const biosyslit = {

    method: 'GET',
    path: '/',
    handler:  async function(request, h) {

        try {
            const result = await request.server.methods.apiRoot.v2(uri);
            return h.response({"data": result})
                 .type('application/json')
        }
        catch (err) {
            console.error(err)
        }
    },

    config: {
        description: "biosyslit v2",
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
    }
};

const apiRoot = async (id) => {
        
    const { res, payload } = await Wreck.get(id);
    return payload.toString();
};

module.exports = {
    biosyslit: biosyslit,
    apiRoot: apiRoot
};