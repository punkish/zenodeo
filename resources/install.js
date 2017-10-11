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

    handler: function(request, reply) {
        reply.view('install');
    }
};
    
module.exports = install;