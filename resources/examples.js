'use strict';

module.exports = {
    
    method: 'GET',

    path: '/examples',

    config: {
        description: 'Examples',
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'examples', 

            // data
            null,

            // layout
            { layout: 'main' }
        );
    }
};
