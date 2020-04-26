'use strict';

module.exports = {
    
    method: 'GET',

    path: '/tos',

    config: {
        description: 'Terms of service',
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'tos', 

            // data
            null,

            // layout
            { layout: 'main' }
        );
    }
};
