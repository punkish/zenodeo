const config = require('config');
const authors = config.get('data.authors');
const keywords = config.get('data.keywords');
const taxa = config.get('data.taxa');
const families = config.get('data.families');

const data = {
    authors: require(authors),
    keywords: require(keywords),
    taxa: require(taxa),
    families: require(families),
}

module.exports = {
    find: function(pattern, source) {
        const re = new RegExp(`^${pattern}`, 'i');
        const res = data[source].filter(function(element) {
            return (element.search(re) > -1)
        });
    
        return(res);
    }
}