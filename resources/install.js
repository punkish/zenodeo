const install = {
    
    method: 'GET',

    path: '/install',

    config: {
        description: "installation instructions",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'root',
        ]
    },

    handler: function(request, h) {
        return h.view(

            // content template
            'install', 

            // data
            null,

            // layout
            { layout: 'main' }
        );
    }
};
    
module.exports = install;