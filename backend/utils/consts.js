// never NEVER require someting here unless you're sure, its loaded very early.

var moment = require('moment-timezone');
var _ = require('lodash');
var util = require('util');
var mongoose = require('mongoose');

let config = require(global.__base + "/backend/config.js");

function initConsts() {
    const consts = {
        ADMIN_USER: 'boaz@smartbull.co.il',

        Million: 1000000,

        // feature flags
        // FF_APPROVALS: 'APPROVALS',

        WORKER_JOBS:{
            SOME_MAIL: 'SOME_MAIL',
            MIGRATE: 'MIGRATE',
        },

        // Raw collection names, skipping a model for these
        DB_COLS:{
            GOV_HOLDINGS_RAW: "gov_holdings_raw",
            FOREIGN_HOLDINGS_RAW: "foreign_holdings_raw",
            FOREIGN_HOLDINGS: "foreign_holdings",
            FOREIGN_HOLDINGS_PROCESS_ERRORS: "foreign_holdings_process_errors",
            FOREIGN_HOLDINGS_SUMS: "foreign_holdings_sums",
        }
    }


    return consts;
}

module.exports = initConsts();
