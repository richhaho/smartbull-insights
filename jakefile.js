
global.__base = __dirname + '/';

let Q = require("q");
Q.props = obj => {
    const ps = Q.all(Object.keys(obj).map(x => Q.all([x, obj[x]])));
    return ps.then(x => x.reduce((p, c) => {p[c[0]] = c[1]; return p } , {}));
};

let fs = require("fs");
let util = require('util');
let moment = require('moment');
let _ = require('lodash');

let Consts = require(global.__base + "/backend/utils/consts.js"),
    config = require(global.__base + "/backend/config.js"),
    SbUtils = require(global.__base + "./backend/utils/SbUtils.js")

let mongoose = require('mongoose');
mongoose.Promise = Q.Promise;
// mongoose.set('debug', true);

console.log('start time', moment().toString());

let DbUtils = require(global.__base + "/backend/utils/db_utils.js");
let User;


namespace('sb', function() {
    desc("init environment");
    task('env', [], function (params) {
        User = require('./backend/models/user');
        console.log("init env");

        mongoose.set('debug', true);
        mongoose.connect(config.mongodb_uri);
    })

    desc("default - print config");
    task('default', [], function (params) {
        console.log('This is the default task.');
    });

    jake.addListener('complete', function () {
        console.log('_____finished_____')
        process.exit();
    });
});
