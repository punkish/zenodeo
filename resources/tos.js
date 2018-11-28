const tos = {
    
    method: 'GET',

    path: '/tos',

    config: {
        description: "terms of service",
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
    
module.exports = tos;