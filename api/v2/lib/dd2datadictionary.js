'use strict';

/***********************************************************************
 * 
 * Here we import the raw data definitions defined in dd.js and the  
 * files included therein, and export a combined and flattened data-
 * dictionary as well as the resources grouped by resourceGroups to 
 * facilitate fast and convenient lookups. 
 * 
 **********************************************************************/

const { dd, commonParams } = require('../../../dataDictionary/dd');

const dd2datadictionary = function() {

    // We will flatten and compile the data dictionary by 
    // converting the following
    //
    //      dd = {
    //          zenodeoCore: { 
    //              treatments: {
    //                  cache: true,
    //                  fields [ {}, {} … ]
    //               }
    //          },
    //          zenodeoRelated: { 
    //              treatments: {
    //                  cache: true,
    //                  fields [ {}, {} … ]
    //               },
    //               …
    //          },
    //          lookups: { 
    //              about: {
    //                  cache: false,
    //                  fields [ {} ]
    //               },
    //               …
    //          }
    //      }
    //
    // to the following
    //
    //      dataDictionary = {
    //          treatments: [],
    //          figureCitations: [],
    //          bibRefCitations: [],
    //          …
    //      }
    //
    // In the process, we will also add the required
    // common parameters to all the resources
    const dataDictionary = {};

    // We will also create a bundle of all the resources
    // grouped by their resource groups, and carrying with 
    // them the name of the 'resource' and the name of the 
    // 'resourceId'. This will look like
    //
    //       zenodeoCore: [
    //           {
    //               name: "treatments",
    //               resourceId: "treatmentId"
    //           }
    //       ],
    //       zenodeoRelated: [
    //           {
    //               name: "figureCitations",
    //               resourceId: "figureCitationId"
    //           },
    //           {
    //               name: "bibRefCitations",
    //               resourceId: "bibRefCitationId"
    //           },
    const resourceGroups = {};

    // loop over each resourceGroup 'rg' in the raw dd
    // 'rg' will be one of
    // - zenodeoCore
    // - zendeoRelated
    // - zenodo
    // - lookups
    for (let rg in dd) {


        resourceGroups[rg] = [];
        
        // loop over each resource in the respective resource groups
        const groupResources = dd[rg];
        for (let resource in groupResources) {

            
            // Add the commonParams to the fields of 'all' the resources 
            // no matter which resourceGroup they are in (hence, the 'all')
            let rf = groupResources[resource].fields;
            rf.push(...commonParams['all']);

            // Don't add any params if a particular resourceGroup's
            // specific commonParams are empty. This ensures nothing 
            // is added to 'treatments' which is a part of 'zenodeoCore'
            // and to all the lookups. We do this by testing whether the 
            // commonParams of a 'rg' are empty by checking its .length()
            if (commonParams[rg].length) {

                // we are using concat() instead of push() because we 
                // want to add these parameters in front of the array
                // rather than at the end of the array
                rf = [].concat(commonParams[rg], rf)
            }

            // For every resource, we add its name and the name of its
            // resourceId key to the resourceGroups hash
            let name = resource;
            let resourceId = '';
            
            for (let i = 0, j = rf.length; i < j; i++) {

                if (rg !== 'lookups') {

                    if (rf[i].resourceId) {

                        if (rf[i].resourceId === true) {

                            resourceId = rf[i].plaziName;
                            break;
                        }
                    }
                    
                }

            }

            resourceGroups[rg].push({ 
                name: name,
                resourceId: resourceId,
                cache: groupResources[resource].cache
            });
            
            dataDictionary[resource] = rf;
            
        }

        

    }

    return {
        dataDictionary: dataDictionary, 
        resourceGroups: resourceGroups
    };
    
};

const test = function() {

    const dd = dd2datadictionary();
    console.log(JSON.stringify(dd, null, '    '));

};

// https://stackoverflow.com/questions/6398196/detect-if-called-through-require-or-directly-by-command-line?rq=1
if (require.main === module) {
    
    test();
} 
else {
    
    module.exports = (dd2datadictionary)();
}