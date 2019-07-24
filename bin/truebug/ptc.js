'use strict';

const cheerio = require('cheerio');
const chance = require('chance').Chance();

const xml = `<subSubSection type="reference_group">
<paragraph>
<treatmentCitationGroup>
<taxonomicName authorityName="Meyrick" authorityYear="1915" class="Insecta" family="Gracillariidae" genus="Phyllocnistis" higherTaxonomySource="GBIF" kingdom="Animalia" order="Lepidoptera" pageId="22" pageNumber="323" phylum="Arthropoda" rank="species" species="sciophanta">
<emphasis>Phyllocnistis sciophanta</emphasis>
</taxonomicName>
; 
<treatmentCitation author="Meyrick" year="1915">
<bibRefCitation author="Meyrick" refString="Meyrick, E. (1915 b) Descriptions of South American Micro-Lepidoptera. Transactions of the Entomological Society of London, 1915 (2), 201 - 256. https: // doi. org / 10.1111 / j. 1365 - 2311.1915. tb 02527. x" type="journal article" year="1915" yearSuffix="b">Meyrick 1915b</bibRefCitation>
: 241
</treatmentCitation>
. 
<treatmentCitation author="Davis" year="1984">
<bibRefCitation author="Davis" refString="Davis, D. R. &amp; Miller, S. E. (1984) Gracillariidae. In: Heppner, J. B. (Ed.), Atlas of Neotropical Lepidoptera, Checklist. Part 1. Dr. W. Junk Publishers, The Hague, pp. 25 - 27." type="book chapter" year="1984">Davis &amp; Miller 1984</bibRefCitation>
: 27
</treatmentCitation>
. De Prins 
<emphasis>et al</emphasis>
. 2016: 37.
</treatmentCitationGroup>
</paragraph>
</subSubSection>`;

const parseTreatmentCitations = function($, treatmentId) {

    let tc = [];
    const trecitgroups = $('treatmentCitationGroup', 'subSubSection[type=reference_group]');
    
    if (trecitgroups.length) {
        
        let i = 0;
        let j = trecitgroups.length;

        for (; i < j; i++) {
            const trecitgroup = $(trecitgroups[i]);
            const taxonomicName = $('taxonomicName', trecitgroup);            
            let tname = Array.isArray(taxonomicName) ? taxonomicName[0] : taxonomicName;

            let tcPrefixArray = [];
            tcPrefixArray.push(tname.text().trim());
            tcPrefixArray.push(tname.attr('authorityName') + ',');
            tcPrefixArray.push(tname.attr('authorityYear'));

            let tcPrefix = tcPrefixArray.join(' ');
            
            const treatmentCitations = $('treatmentCitation', trecitgroup);
            const treatmentCitationId = chance.guid();

            let treatmentCitation;
            if (treatmentCitations.length) {

                let k = 0;
                let l = treatmentCitations.length

                for (; k < l; k++) {
                    treatmentCitation = tcPrefix;

                    const bib = $('bibRefCitation', treatmentCitations[k]);
                    if (k > 0) {
                        treatmentCitation += ' sec. ' + bib.text();
                    }

                    tc.push({
                        treatmentCitationId: treatmentCitationId,
                        treatmentId: treatmentId,
                        treatmentCitation: treatmentCitation,
                        refString: bib.attr('refString'),
                        deleted: 'false'
                    });
                }
            }
            else {
                treatmentCitation = tcPrefix;

                const bib = $('bibRefCitation', treatmentCitations);
                if (bib) {
                    treatmentCitation += ' sec. ' + bib.text()
                }

                tc.push({
                    treatmentCitationId: treatmentCitationId,
                    treatmentId: treatmentId,
                    treatmentCitation: treatmentCitation,
                    refString: bib.attr('refString'),
                    deleted: 'false'
                });
            }
        }
        
    }

    return tc;

};

const $ = cheerio.load(xml, {
    normalizeWhitespace: true,
    xmlMode: true
});

let tc = parseTreatmentCitations($);
console.log(tc);