const Crypto = require('crypto');

const utils = {
    createCacheKey: function(str) {
        return Crypto
            .createHash('md5')
            .update(str, 'utf8')
            .digest('hex');
    }
};

module.exports = utils;