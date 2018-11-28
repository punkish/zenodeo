/* template */
// create URI
// create cacheKey

let result;
if (request.query.refreshCache) {

    if (result = getResult()) {

        // getResult succeeded, so update the cache
        // with the new result
        Utils.updateCache(Cache, cacheKey, result);
        return result;
    }
    else {
        
        // getResult failed, so check if result 
        // exists in cache
        if (result = Cache.getSync(cacheKey)) {

            // return result from cache
            return result;
        }
        else {

            // no result in cache
            return {
                "data": [],
                "error": "nothing found"
            };
        }
    }
}
else {
    if (result = Cache.getSync(cacheKey)) {

        // return result from cache
        return result;
    }
    else {
        if (result = getResult()) {
            Utils.updateCache(Cache, cacheKey, result);
            return result;
        }
        else {
            return {
                "data": [],
                "error": "nothing found"
            };
        }
    }
}