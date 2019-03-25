'use strict';

const fs = require('fs');

const compare = {
    same: [],
    diff: [],

    sift: function(fileNewArr, fileOld) {
        for (let i = 0, j = fileNewArr.length; i < j; i++) {
            if (fs.existsSync(`${fileOld}/${fileNewArr[i]}`)) {
                this.same.push(fileNewArr[i]);
            }
            else {
                this.diff.push(fileNewArr[i]);
            }
        }

        return [same, diff];
    }
};

module.exports = compare;