'use strict';

module.exports = {
    
    method: 'GET',

    path: '/about',

    config: {
        description: 'About',
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'about', 

            // data
            null,

            // layout
            { layout: 'main' }
        );
    }
};
