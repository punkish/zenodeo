'use strict';

module.exports = {
    
    method: 'GET',

    path: '/install',

    config: {
        description: 'Installation instructions',
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'install', 

            // data
            null,

            // layout
            { layout: 'main' }
        );
    }
};
