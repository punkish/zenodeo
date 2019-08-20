'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('data.treatments'));
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

const select = 'SELECT id, t.treatmentId, t.treatmentTitle, snippet(vtreatments, 1, "<b>", "</b>", "", 50) AS context FROM treatments t JOIN vtreatments v ON t.treatmentId = v.treatmentId WHERE vtreatments MATCH @q LIMIT @limit OFFSET @offset';

const count = 'SELECT Count(treatmentAuthorId) AS numOfRecords FROM treatmentAuthors WHERE treatmentAuthor LIKE @q';

const stats = {
    chart1: [
        'SELECT Count(*) AS "materials citations" FROM materialsCitations WHERE {0}',

        'SELECT Count(DISTINCT collectionCode) AS "collection codes" FROM materialsCitations WHERE {0}',

        'SELECT Count(DISTINCT collectingCountry) AS "collecting countries" FROM materialsCitations WHERE {0}',

        'SELECT Sum(specimenCountFemale) AS "total female specimens" FROM materialsCitations WHERE {0}',

        'SELECT Sum(specimenCountMale) AS "total male specimens" FROM materialsCitations WHERE {0}',

        'SELECT Sum(specimenCount) AS "total specimens" FROM materialsCitations WHERE {0}'
    ],

    chart2: [
        'SELECT DISTINCT collectionCode AS "collection codes", Count(*) AS "materials citations" FROM materialsCitations WHERE {0} GROUP BY collectionCode ORDER BY "materials citations" DESC LIMIT 10'
    ],
    
    chart3: [
        'SELECT DISTINCT collectingCountry AS "collecting country", Count(*) AS "materials citations" FROM materialsCitations WHERE {0} GROUP BY collectingCountry ORDER BY "materials citations"'
    ]
}

function calcStats({stats, queryObject}) {

    let where = '';
    if (queryObject && Object.keys(queryObject).length) {

        // first, figure out the cols and params 
        const cols = [];
        const vals = [];
        const searchCriteria = {}; 

        for (let col in queryObject) {

            if (col !== 'id') {
                vals.push( queryObject[col] );
                searchCriteria[col] = queryObject[col];

                // we add double quotes to 'order' otherwise the sql 
                // statement would choke since order is a reserved word
                if (col === 'order') {
                    cols.push('"order" = @order');
                }
                else {
                    cols.push(`${col} = @${col}`);
                }
                
            }

        }

        where = cols.join(' AND ');
    }

    const selectStats =  {};
    if (where) {
        for (let chart in stats) {
            selectStats[chart] = stats[chart].map(s => s.format(where))
        }
    }
    else {
        for (let chart in stats) {
            selectStats[chart] = stats[chart];
        }
    }

    const statistics = {};
    let chartKey = 'keys';
    let chartVal = 'vals';

    for (let chart in selectStats) {
        const queries = selectStats[chart];
        
        statistics[chart] = {};

        queries.forEach(q => {
            console.log(q)
            const rows = db.prepare(q).all(queryObject);
            if (rows.length > 1) {
                rows.forEach((row, index) => {
                    if (index === 0) {
                        chartKey = Object.keys(row)[0];
                        chartVal = Object.keys(row)[1];
                    }

                    if (statistics[chart][chartKey]) {
                        statistics[chart][chartKey].push(Object.values(row)[0]);
                    }
                    else {
                        statistics[chart][chartKey] = [ Object.values(row)[0] ];
                    }

                    if (statistics[chart][chartVal]) {
                        statistics[chart][chartVal].push(Object.values(row)[1]);
                    }
                    else {
                        statistics[chart][chartVal] = [ Object.values(row)[1] ];
                    }
                })
            }
            else {
                for (let [key, val] of Object.entries(rows[0])) {
                    if (statistics[chart][chartKey]) {
                        statistics[chart][chartKey].push(key);
                    }
                    else {
                        statistics[chart][chartKey] = [ key ];
                    }
                    
                    if (statistics[chart][chartVal]) {
                        statistics[chart][chartVal].push(val);
                    }
                    else {
                        statistics[chart][chartVal] = [ val ];
                    }
                }
            }
        })
    }

    return statistics;

}

const statistics = calcStats({stats: stats, queryObject: {0: 0}});
console.log(statistics);