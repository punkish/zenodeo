'use strict';

const fs = require('fs');
const showdown = require('showdown');
const footnotes = require('../public/js/footnotes.js');
const sh = new showdown.Converter({extensions: [footnotes], tables: true});
const dir = './resources/text';

module.exports = {
    
    method: 'GET',

    path: '/workflow',

    config: {
        description: "The development – fix – test – deploy workflow",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'The development – fix – test – deploy workflo',
        ]
    },

    handler: function(request, h) {

        const data = {
            mainstuf: getRecords('workflow')
        };

        return h.view(

            // content template
            'workflow', 

            // data
            data,

            { layout: 'main' }
        );
    }
};

const getRecords = function(file) {

    const content = fs.readFileSync(`${dir}/${file}.md`, 'utf8');
    const html = sh.makeHtml(content);
    return html;
}