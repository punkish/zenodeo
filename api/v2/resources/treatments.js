const Schema = require('../schema.js');
const ResponseMessages = require('../../responseMessages');
const Database = require('better-sqlite3');
const config = require('config');
const sqliteDatabase = config.get('data.sqliteDatabase');
const db = new Database(sqliteDatabase);
const fs = require('fs');
const Utils = require('../utils');

module.exports = {

    plugin: {
        name: 'treatments2',
        register: function(server, options) {

            const treatmentsCache = server.cache({
                cache: options.cacheName,
                expiresIn: options.expiresIn,
                generateTimeout: options.generateTimeout,
                segment: 'treatments2', 
                generateFunc: async (query) => { return await getTreatments(query) },
                getDecoratedValue: options.getDecoratedValue
            });

            // binds treatmentsCache to every route registered  
            // **within this plugin** after this line
            server.bind({ treatmentsCache });

            server.route([
                { 
                    path: '/treatments', 
                    method: 'GET', 
                    config: {
                        description: "Retrieve treatments",
                        tags: ['treatments', 'api'],
                        plugins: {
                            'hapi-swagger': {
                                order: 3,
                                responseMessages: ResponseMessages
                            }
                        },
                        //validate: Schema.treatments,
                        notes: [
                            'A taxonomic treatment.',
                        ]
                    },
                    handler 
                }
            ]);
        },
    },
};

const getTreatments = async function(query) {

    qryObj = {};
    query.split('&').forEach(el => { a = el.split('='); qryObj[ a[0] ] = a[1]; })

    let selectTreatments = '';

    // There are three kinds of possible queries for treatments
    //
    // 1. A 'treatmentId' is present. The query is for a specific
    // treatment. All other query params are ignored

    if (qryObj.treatmentId) {

        const one = qryObj.treatmentId.substr(0, 1);
        const two = qryObj.treatmentId.substr(0, 2);
        const thr = qryObj.treatmentId.substr(0, 3);

        if (qryObj.format === 'xml') {

            return fs.readFileSync(
                `data/treatments/${one}/${two}/${thr}/${qryObj.treatmentId}.xml`,
                'utf8'
            )

        }
        else {
            selectTreatments = 'SELECT * FROM treatments WHERE treatmentId = ?';
            let data = db.prepare(selectTreatments).get(qryObj.treatmentId);
            
            const xml = fs.readFileSync(
                `data/treatments/${one}/${two}/${thr}/${qryObj.treatmentId}.xml`,
                'utf8'
            )
    
            const selectMaterialCitations = "SELECT treatmentId, typeStatus, latitude, longitude FROM materialCitations WHERE latitude != '' AND longitude != '' AND treatmentId = ?";
    
            const mcData = db.prepare(selectMaterialCitations).all(qryObj.treatmentId);
    
            if (mcData.length) {
                data['materialCitations'] = mcData
            }
            
    
            data['images'] = await Utils.getImages(qryObj.treatmentId);
            data['xml'] = xml;
    
            return data
        }
        
    }

    
    // 2. The param 'q' is present. The query is a fullText query.
    // There could be other optional params to narrow the result.
    else if (qryObj.q) {

        selectTreatments = `SELECT v.treatmentId, t.treatmentTitle, 
                                snippet(v.vtreatments, 1, '<b>', '</b>', '', 25) s 
                            FROM vtreatments v JOIN treatments t ON 
                                v.treatmentId = t.treatmentId 
                            WHERE vtreatments MATCH ?`;

        // queryParams.splice(queryParams.indexOf('q'), 1);
        // for (let i = 0, j = queryParams.length; i < j; i++) {
        // }
        console.log(selectTreatments)
        return db.prepare(selectTreatments).all(qryObj.q)

    }

    // 3. 'lat' and 'lon' are present in the query string, so 
    // this is a location query. A location query is performed 
    // against the 'materialcitations' table
    else if (qryObj.lat && qryObj.lon) {

        selectTreatments = 'SELECT * FROM materialcitations WHERE latitude = ? AND longitude = ?'
        console.log(selectTreatments)
        return db.prepare(selectTreatments).all(qryObj.lat, qryObj.lon)
        //const selectTreatment = db.prepare('SELECT * FROM treatments WHERE treatmentId = @treatmentId');
        //lat=20.719528&lon=104.99638
        
    }

    // 4. Neither the 'treatmentId' nor 'q' are present. The query 
    // A standard SQL query is performed against the treatments 
    // database 
    else {

        let cols = [];
        let vals = [];

        for (let col in qryObj) {

            vals.push( qryObj[col] )

            // we add double quotes to 'order' otherwise the 
            // sql statement would choke since order is a  
            // reserved word
            if (col === 'order') col = '"order"';
            cols.push(col + ' = ?');

        }

        selectTreatments = `SELECT treatmentId, treatmentTitle, journalTitle || ', ' || journalYear || ', ' || pages || ', ' || journalVolume || ', ' || journalIssue AS s FROM treatments WHERE ${cols.join(' AND ')} LIMIT 30`;
        return db.prepare(selectTreatments).all(vals)
        
    }

}

const handler = function(request, h) {

    // remove 'refreshCache' from the query params and make the 
    // queryString into a standard form (all params sorted) so
    // it can be used as a cachekey
    let arr = [];

    for (let k in request.query) {
        if (k !== 'refreshCache') {
            arr.push(k + '=' + request.query[k])
        }
    }

    const query = arr.sort().join('&');

    if (request.query.refreshCache === 'true') {
        console.log('forcing refreshCache')
        this.treatmentsCache.drop(query);
    }

    return this.treatmentsCache.get(query);
    
};