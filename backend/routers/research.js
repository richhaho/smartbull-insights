let express = require('express');
let Q = require("q");

let moment = require('moment');
let _ = require('lodash');

let config = require(global.__base + "/backend/config.js"),
    Consts = require(global.__base + "/backend/utils/consts"),
    SbUtils = require(global.__base + "/backend/utils/SbUtils"),
    DbUtils = require(global.__base + "/backend/utils/db_utils");

let User = require(global.__base + '/backend/models/user');
let ForeignHoldings = require(global.__base + '/backend/models/foreign_holdings');
let GovHoldings = require(global.__base + '/backend/models/gov_holdings');

let createRouter = function (baseRoute) {
    let _errorInRoute = SbUtils.createErrorInRouteFunc('research');

    let router = express.Router();

    router.get([
        '/raw-data',
        '/foreign-holdings/:foreign-holdings-data-type'],
        async function (req, res) {
            const foreignHoldingsDataType = req.params['foreign-holdings-data-type'];
            console.log(`getting raw data for ${foreignHoldingsDataType}`);
            const foreignHoldings = new ForeignHoldings();
            const feInitSuccess = await foreignHoldings.init();
            if (!feInitSuccess) {
                _errorInRoute(req, res, 'failed to load ForeignHoldings');
                return;
            }

            const govHoldings = new GovHoldings();
            const ghInitSuccess = await govHoldings.init();
            if (!ghInitSuccess) {
                _errorInRoute(req, res, 'failed to load GovHoldings');
                return;
            }

            const data = {
                foreignHoldings: foreignHoldings.getProcessedData(foreignHoldingsDataType),
                govHoldings: govHoldings.getRawData(),
                foreignHoldingsSums: await foreignHoldings.getRawDataSums(),
        };
            if (SbUtils.isSBADM(req.user)){
                data.foreignHoldingsProcessingErrors = await foreignHoldings.getRawDataProcessingErrors();
            }
            res.json(data)
        });

    return router;
};

module.exports = createRouter;
