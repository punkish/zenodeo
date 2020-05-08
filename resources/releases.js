'use strict';

module.exports = {
    
    method: 'GET',

    path: '/releases',

    config: {
        description: "release notes",
        tags: ['zenodeo'],
        validate: {},
        notes: [
            'release notes',
        ]
    },

    handler: function(request, h) {

        const data = getRecords();

        return h.view(

            // content template
            'releases', 

            // data
            data,

            { layout: 'main' }
        );
    }
};

const getRecords = function() {

    return {
        notes: [
            {
                summary: 'version 2.6.0',
                detail: `
                <ul>
                    <li>Major refactoring resulting in a lot less code and a lot more comments. The previous master branch had
<pre>
206 text files.
205 unique files.
    6 files ignored.
               
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                      95           1884           1501           8309
CSS                             87           1297           1073           5842
HTML                            13             91             31            406
Markdown                         3             44              0             85
JSON                             2              0              0             51
-------------------------------------------------------------------------------
SUM:                           200           3316           2605          14693
-------------------------------------------------------------------------------
</pre>

                This branch has

<pre>
195 text files.
194 unique files.
  4 files ignored.

-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JavaScript                      85           1552           1096           6501
CSS                             87           1297           1073           5842
JSON                             3              0              0           2360
HTML                            13             72             31            336
Markdown                         3             44              0             85
-------------------------------------------------------------------------------
SUM:                           191           2965           2200          15124
-------------------------------------------------------------------------------
</pre>

                    That is 1808 fewer lines of code, or a ~22% reduction.
                    
                    </li>
                    <li>A brand new data dictionary has been implemented.<li>
                    <li>A move to configuration over code philosophy. For example, the data dictionary generates the schema that is used to validate input queries and it generates the SQL queries that query the database</li>
                    <li>Executed queries along with the performance metrics are now stored in a separate database along with the count of how many times they've been made. Besides providing an insight in the performance bottlenecks, this may also provide an insight into the trends of the data being queried by the users.</li>
                    <li>The underlying software has been bumped up to the latest version including the entire <code>hapijs</code> suite.
                    <li>Schema validation now returns more meaningful and helpful messages when validation fails.</li>
                </ul>`
            },

            {
                summary: 'version 2.5.0',
                detail: `
                <ul>
                    <li>All columns in all tables are now queryable</li>
                    <li>LIKE searches are case-insensitive and non-exact</li>
                    <li>'test' instance now returns debug information along with performance metrics</li>
                </ul>`
            },

            {
                summary: 'version 2.0.1',
                detail: `
                <ul>
                    <li>
                        All the data in the database are now exposed via the API with four new routes to query<br>

                        <ul>
                            <li>figureCitations : <a href="https://zenodeo.org/v2/figurecitations">https://zenodeo.org/v2/figurecitations</a></li>
                            <li>bibRefCitations : <a href="https://zenodeo.org/v2/bibrefcitations">https://zenodeo.org/v2/bibrefcitations</a></li>
                            <li>materialsCitations : <a href="https://zenodeo.org/v2/materialscitations">https://zenodeo.org/v2/materialscitations</a></li>
                            <li>treatmentAuthors : <a href="https://zenodeo.org/v2/treatmentauthors">https://zenodeo.org/v2/treatmentauthors</a></li>
                        </ul>
                
                        The above four routes, along with <a href="https://zenodeo.org/v2/treatments">https://zenodeo.org/v2/treatments</a> now expose all the data ETL-ed from XMLs. By appending queries to the above URIs, you can constrain the results.
                    </li>

                    <li>
                        Every query now also returns a ‘statistics’ object that has contextual stats for the resource. So, if you don’t append any queries to the above URIs, the returned statistics reflect the entire corpus (for that resource). If a query is appended, then the stats are relevant only to the result dataset.
                    </li>
            
                    <li>
                        All returned data are now in the <a href="http://stateless.co/hal_specification.html" target="_blank">Hypertext Application Language (HAL)</a> format making the entire API <a href="https://en.wikipedia.org/wiki/HATEOAS" target="_blank">HATEOAS-compliant</a>. You can explore all the data now by just clicking the hyperlinks of &apos;related records&apos; in any returned dataset.
                    </li>
            
                    <li>Full text search (FTS) is now possible within the following resources

                        <ul>
                            <li>figureCitations.captionText</li>
                            <li>bibRefCitations.refString</li>
                            <li>treatments.fulltext</li>
                        </ul>

                    </li>
            
                    <li>
                        Querying by lat/lon is unintuitive for the common user. Enhanced and easy location search is now possible by automatically doing a &apos;contained&apos; query based on the lat/lon pair provided. For example, the following query <code>https://zenodeo.org/v2/materialscitations?lat=77&amp;lon=78</code> will actually return all the records that are within the following box: <code>latitude &gt; 76.1 AND latitude &lt; 77.9 AND longitude &gt; 77.1 AND longitude &lt; 78.9</code>
    
<pre class="language-text">
lat: 77.9                                       lat: 77.9 
lon: 77.1                                       lon: 78.9
+-----------------------------------------------+
|                                               |
|                                               |
|                        lat: 77.53333          |
|                        lon: 78.88333          |
|                             ++                |
|                                               |
|                                               |
|             lat: 77.2                         |
|             lon: 78.11667                     |
|                 +                             |
|                                               |
|                                               |
+-----------------------------------------------+
lat: 76.1                                      lat: 76.1
lon: 77.1                                      lon: 78.9
</pre>
                    </li>

                    <li>
                        Contextual (resource&#x2013; and query-specific) statistics are returned for every resource. If no query is specified (other than <code>stats=true</code>) then stats for the entire resource-set will be returned. If a query is specified, then stats for the returned data will be included.
                    </li>
                </ul>`
            },

            {
                summary: 'version 1.6.1',
                detail: `
                <ul>
                    <li>async calls to Zenodo are now really async, speeding up the queries significantly</li>
                    <li>A refreshCache switch allows force overwriting results in in cache</li>
                </ul>`
            },

            {
                summary: 'version 1.5.2',
                detail: `
                <ul>
                    <li>Better image layout in examples + link to parent record on Zenodo</li>
                </ul>`
            },

            {
                summary: 'version 1.5.1',
                detail: `
                <ul>
                    <li>Added a persistent cache</li>
                    <li>Made the examples page more elaborate</li>
                </ul>`
            },

            {
                summary: 'version 1.0.1',
                detail: `
                <ul>
                    <li>Initial version with in-memory cache</li>
                </ul>`
            }


        ]
    };
};