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

    handler: function(request, reply) {
        reply.view('about');
    }
};
    
module.exports = about;