// default route, redirects to the most recent API
const debug = require('debug')('default');

const deefault = {
    method: 'GET',
    path: '/{param*}',
    config: {
        description: "default route",
        tags: ['private']
    },
    handler: function(request, h) {

        //debug(request.url);

        let uri = '';

        const APIs = ['v1', 'v2'];
        // const collections = [
        //     'v1',
        //     'v2',
        //     'records',
        //     'communities'
        // ];

        // const singles = [
        //     'record'
        // ];

        
        if (request.params.param) {

            let params = request.params.param.split('/');

            //Debug(params);

            // add latest version if there is no version 
            if ((params[0] !== 'v1') && (params[0] !== 'v2')) {
                params.unshift(`v${APIs.length}`);
            }

            //Debug(params);

            uri = params.join('/');

            // add a trailing slash if requesting a collection
            // 

            // add the query params
            if (request.query) {
                const qry = [];
                for (let q in request.query) {
                    qry.push(`${q}=${request.query[q]}`);
                }

                if (qry.length) {
                    uri += '?' + qry.join('&');
                }
            }
        }

        else {
            uri = `/v${APIs.length}/`;
        }
        

        //debug(`uri: ${uri}`);
        return h.redirect(uri);
    }
};

module.exports = deefault;