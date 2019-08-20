const about = {
    
    method: 'GET',

    path: '/releases',

    config: {
        description: "releases",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'releases', 

            // data
            null,

            // layout
            { layout: 'main' }
        );
    }
};
    
module.exports = about;