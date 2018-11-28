const about = {
    
    method: 'GET',

    path: '/about',

    config: {
        description: "about",
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
    
module.exports = about;