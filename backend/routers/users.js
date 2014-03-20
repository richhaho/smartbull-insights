let express = require('express');

let moment = require('moment');
let _ = require('lodash');

let User = require(global.__base + "/backend/models/user.js");

let SbUtils = require(global.__base + "/backend/utils/SbUtils.js");

let createRouter = function (baseRoute) {

    let _errorInRoute = SbUtils.createErrorInRouteFunc('users');

    let router = express.Router();

    router.post('/sign-eula', function (req, res) {
        console.log("sign-eula", req.body.eulaVersion, typeof req.body.eulaVersion)
        if (req.user.SignEula(req.body.eulaVersion)) {
            console.log(`EULA signed ${req.user.username}`)

            req.user.save().then(dbRes => {
                res.json({ok: true});
            })
        } else {
            _errorInRoute(req, res , 'שגיאה. אנא פנה לתמיכה טכנית');
        }
    });


    // from here - admin only
    router.use(function (req, res, next) {
        if (!SbUtils.isSBADM(req.user)) {
            res.status(401).json({ok: false})
            return;
        }

        next();
    });

    function _filterUserForClient(user) {
        const filterUser = _.pick(user.toObject(),
            '_id username eula_date eula_version'.split(' '));

        filterUser.isEulaSigned= user.isEulaSigned();
        return filterUser;
    }

    router.get('/', function (req, res) {
        User.find({}).then(users=> {
            res.json(users.map(user=>_filterUserForClient(user)));
        }).catch(err=>_errorInRoute(req, res ,err)).done();
    });

    router.post('/', function (req, res) {
        // create and redirect
        let newUser = new User({
            username: req.body.username,
            password: req.body.password
        });
        // save the user
        newUser.save().then(()=>{
            res.json({
                ok: true,
                msg: 'Successfuly created new user.',
                newUser: _filterUserForClient(newUser)
            });
        }).catch(err=>_errorInRoute(req, res ,err)).done();
    });

    router.put('/:_id', async function (req, res) {
        try{
            let user = await User.findById(req.params._id);

            _.pick(req.body, [
                'password'
            ]).forEach(fld => {
                user[fld] = req.body[fld];
            });

            await user.save();
            res.json({ok:true, user: _filterUserForClient(user)})
        }catch (err){
            _errorInRoute(req, res ,err)
        }
    });

    // needs to be last
    router.get('/:_id', async function (req, res) {
        try{
            const user = await User.findById(req.params._id);
            res.json(_filterUserForClient(user))
        }catch (err){
            _errorInRoute(req, res ,err)
        }
    });

    router.delete('/:_id', function (req, res) {
        console.log('deleting user ' + req.params._id);
        User.findByIdAndRemove(req.params._id).then(userDeleted=> {
            res.json({ok: true, userDeleted: _filterUserForClient(userDeleted)})
        }).catch(err=>_errorInRoute(req, res ,err)).done();
    });

    return router;
};

module.exports = createRouter;
