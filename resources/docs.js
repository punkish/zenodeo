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
    
module.exports = docs;