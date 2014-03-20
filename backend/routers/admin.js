let express = require('express');
let Q = require("q");

let moment = require('moment');
let _ = require('lodash');

let Consts = require(global.__base + "/backend/utils/consts.js");
let SbUtils = require(global.__base + "/backend/utils/SbUtils.js");
let DbUtils = require(global.__base + "/backend/utils/db_utils.js");

let AmpqConn = require(global.__base + '/backend/utils/ampq_conn.js')


let createRouter = function(baseRoute) {
    let router = express.Router();

    // Common router logic
    router.use(function(req, res, next) {
        if (!SbUtils.isSBADM(req.user)) {
            res.status(401).json({ok: false})
            return;
        }

        res.locals.baseRoute = baseRoute;
        next();
    });

    let _errorInRoute = SbUtils.createErrorInRouteFunc('admin');

     router.get('/start-migrate', function (req, res) {
        if (req.query.migrationType){
            AmpqConn.getDefaultConnection().publishObject({
                jobType: Consts.WORKER_JOBS.MIGRATE,
                migrationType: req.query.migrationType
            });

            res.json({ok: true, msg:`started ${req.query.migrationType}`});
        }else{
            res.status(500).json({ok:false, msg: 'need migrationType'});
        }
    });


    return router;
};

module.exports = createRouter;
