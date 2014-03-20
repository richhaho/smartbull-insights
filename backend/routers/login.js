let express = require('express');
let Q = require("q");

let moment = require('moment');
let _ = require('lodash');

let jwt = require('jsonwebtoken');

let Consts = require(global.__base + "/backend/utils/consts"),
    SbUtils = require(global.__base + "/backend/utils/SbUtils"),
    DbUtils = require(global.__base + "/backend/utils/db_utils"),
    config = require(global.__base + "/backend/config");


    let User = require(global.__base + 'backend/models/user');

let createRouter = function (baseRoute) {
    let _errorInRoute = SbUtils.createErrorInRouteFunc('login');

    let router = express.Router();

    router.post('/login', function(req, res) {

        User.findOne({
            username: req.body.username
        }).then(user => {
            if (!user) {
                return res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
            }

            // check if password matches
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    // if user is found and password is right create a token
                    const
                        token = jwt.sign({
                            _id: user._id.toString(),
                            jti: user.jti
                        }, config.jwt_secret),
                        userFiltered = {
                            username: user.username,
                            sbadm: SbUtils.isSBADM(user),
                            isEulaSigned: user.isEulaSigned()
                        },
                        resp = {
                            ok: true, token,

                            user: userFiltered,
                            currEulaVersion: User.CURR_EULA_VERSION,
                        };

                    res.json(resp);
                }else{
                    res.status(401).send({ok: false, msg: 'Authentication failed. Wrong password.'});
                }
            });
        }).catch(err => _errorInRoute(req, res, err)).done()
    });

    /*
    router.post('/signup', function(req, res) {
        if (!req.body.username || !req.body.password) {
            res.json({success: false, msg: 'Please pass username and password.'});
        } else {
            var newUser = new User({
                username: req.body.username,
                password: req.body.password
            });
            // save the user
            newUser.save(function(err) {
                if (err) {
                    return res.json({success: false, msg: 'Username already exists.'});
                }
                res.json({success: true, msg: 'Successful created new user.'});
            });
        }
    });
    */

    return router;
};

module.exports = createRouter;
