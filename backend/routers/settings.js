let express = require('express');
let Q = require("q");

let moment = require('moment');
let _ = require('lodash');

let Consts = require(global.__base + "/backend/utils/consts.js");
let SbUtils = require(global.__base + "/backend/utils/SbUtils.js");
let DbUtils = require(global.__base + "/backend/utils/db_utils.js");

let createRouter = function(baseRoute) {
    let _isAuthenticated = function(req){ return (!!req.user); };

    let router = express.Router();

    // Common router logic
    router.use(function(req, res, next){
      if (!_isAuthenticated(req)){
        res.redirect('/');
        return;
      }
        res.locals.view_js =  ['/js/init-bootstrap-dialog.js', '/js/common.js'];
        res.locals.baseRoute = baseRoute; 
        next();
    });

    let _errorInRoute = SbUtils.createErrorInRouteFunc('settings');

    router.get('/', function (req, res) {
        // Somehting.find().then(underwriterSettings => {
        //     res.render('settings-accounts', {
        //         title: 'ניהול חשבונות הנפקה',
        //         underwriterSettings: underwriterSettings
        //     });
        // }).catch(err=>_errorInRoute(req, res, err)).done()
    });

    router.put('/', function(req, res) {
        // Somehting.find().then(smtng => {
        //     console.log('smtng', smtng);
        //     return smtng.save();
        // }).then(dbRes=>{
        //     res.redirect(baseRoute+'/')
        // }).catch(err=>_errorInRoute(req, res, err)).done()

    });

    return router;
};

module.exports = createRouter;
