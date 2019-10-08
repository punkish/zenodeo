'use strict';

String.prototype.strfmt = function() {
    return this.replace(/{(\w+)}/g, (match, number) => arguments['0'][number]);
};

let str = 'SELECT Count(DISTINCT {col}) AS count_of_{col} FROM treatments';

const facets = ['collection', 'year', 'kingdom'];
facets.forEach(f => console.log(str.strfmt({col: f}) ))

