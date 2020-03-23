'use strict';

const qm = require('../api/v2/lib/qm');
const params = qm.test.params;
const getSql = qm.getSql;

getSql(params[0]);