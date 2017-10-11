const docs = {
    
    method: 'GET',

    path: '/docs',

    config: {
        description: "docs",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, reply) {
        reply.view('docs', null, {layout: 'docs'});
    }
};
    
module.exports = docs;