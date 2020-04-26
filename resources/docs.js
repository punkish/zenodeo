'use strict';

module.exports = {
    
    method: 'GET',

    path: '/docs',

    config: {
        description: 'Documentation',
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'docs', 

            // data
            null,

            // layout
            { layout: 'docs' }
        );
    }
};
