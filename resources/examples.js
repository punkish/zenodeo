const examples = {
    
    method: 'GET',

    path: '/examples',

    config: {
        description: "Examples",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, reply) {
        reply.view('examples');
    }
};
    
module.exports = examples;