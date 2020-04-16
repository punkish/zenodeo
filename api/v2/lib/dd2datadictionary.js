'use strict';

const { dd, commonParams } = require('../../../dataDictionary/dd');

module.exports = (function() {

    const dataDictionary = [];

    const resourceGroups = {};

    for (let rg in dd) {

        resourceGroups[rg] = [];
        const resources = dd[rg];

        for (let r in resources) {

            resources[r].push(...commonParams['all']);

            // this ensures that nothing is added to 'treatments'
            if (commonParams[rg].length) {
                resources[r].push(...commonParams[rg]);
            }
            
            
            
            //if (rg === 'zenodo') {

            //    resources[r].push(...commonZenodoQueryParams);
            //}
            //else if (rg === 'zenodeo') {

            //    if (r !== 'treatments') {

            //        resources[r].push(...commonZenodeoQueryParams);
            //    }
            //}

            for (let i = 0, j = resources[r].length; i < j; i++) {

                if (rg === 'lookups') {

                    resourceGroups[rg].push({ 
                        name: r,
                        resourceId: ''
                    });
                    break;
                }
                else {

                    if (resources[r][i].resourceId && resources[r][i].resourceId === true) {

                        resourceGroups[rg].push({ 
                            name: r,
                            resourceId: resources[r][i].plaziName
                        });
                        break;
                    }
                }

            }

            dataDictionary.push(...resources[r]);
        }

    }

    return {
        dataDictionary: dataDictionary, 
        resourceGroups: resourceGroups
    };
    
})();