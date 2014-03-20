let path = require('path');
let TestUtils= require("./test-utils.js"); // need to be first-ish

let util = require('util');
let moment = require('moment');
let _ = require('lodash');
let assert = require("assert");
let Q = require("q");
let fs = require("fs");

let mocha = require("mocha");
let describe = mocha.describe,
    it = mocha.it,
    beforeEach = mocha.beforeEach;

let mongoose = require('mongoose');

let config = require(global.__base + "/backend/config"),
    Consts = require(global.__base + "/backend/utils/consts.js"),
    SbUtils = require(global.__base + "/backend/utils/SbUtils.js"),
    DbUtils = require(global.__base + "/backend/utils/db_utils.js")
;



if (config.ggServiceAccountKey === 'wrong on purpose'){
    console.log("skipping fetch from gg test")
}else {
    describe('test google api & post processing', function () {
        mongoose.set('debug', false);

        // ATM its just a way to run this code, less of a real test until
        // some mocking will be introduced and this timeout tuning removed
        this.timeout(30000);

        beforeEach(TestUtils.clearDBBeforeEach);

        it('should fetch read foreign mutual funds inst holdings from google spreadsheet', TestUtils.mochaAsync(async () => {
            let ForeignHoldings = require(global.__base + "/backend/models/foreign_holdings");
            const foreignHoldings = new ForeignHoldings();
            const feInitSuccess = await foreignHoldings.init({
                allowCache: false,
                saveToCache: false,
                clearCache: false
            });
            if (!feInitSuccess) {
                this.migrationInProgress.reject('failed to load ForeignHoldings');
                return;
            }

            const foreignHoldingsRaw = foreignHoldings.getRawData();
            console.log(`got ${_.size(foreignHoldingsRaw)} holdings`);
            console.log("dump", foreignHoldingsRaw.slice(0,100))

        }));

        it('should fetch gov holdings from google spreadsheet', TestUtils.mochaAsync(async () => {
            let GovHoldings = require(global.__base + "/backend/models/gov_holdings");
            const govHoldings = new GovHoldings();
            const ghInitSuccess = await govHoldings.init({allowCache: false, saveToCache: false, clearCache: false});
            if (!ghInitSuccess) {
                _errorInRoute(req, res, 'failed to load GovHoldings');
                return;
            }

            const govHoldingsRaw = govHoldings.getRawData();
            console.log(`govHoldingsRaw: got ${_.size(govHoldingsRaw)} holdings`);

        }));
    });

}
