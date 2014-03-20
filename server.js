//
// # 
//

global.__base = __dirname + '/';

let http = require('http'),
    path = require('path'),
    fs = require('fs');

let Q = require("q");
let moment = require('moment');
let _ = require('lodash');

let express = require('express');
let compression = require('compression');
let bodyParser = require('body-parser');
let methodOverride = require('method-override')

let mongoose = require('mongoose');
mongoose.Promise = require("q").Promise;

let Consts = require(global.__base + "/backend/utils/consts.js"),
    config = require(global.__base + "/backend/config.js"),
    SbUtils = require(global.__base + "./backend/utils/SbUtils.js")

if (SbUtils.isDevelopment()) process.env.Q_DEBUG=1;
Q.props = obj => {
    const ps = Q.all(Object.keys(obj).map(x => Q.all([x, obj[x]])));
    return ps.then(x => x.reduce((p, c) => {p[c[0]] = c[1]; return p } , {}));
};


let AmpqConn = require(global.__base + '/backend/utils/ampq_conn.js')

console.log('start time', moment().toString());

let app = express();
let server = http.createServer(app);

if (config.forceHttps){
    // Add a handler to inspect the req.secure flag (see
    // http://expressjs.com/api#req.secure). This allows us
    // to know whether the request was via http or https.
    app.use (function (req, res, next) {
        if (req.secure) {
            // request was via https, so do no special handling
            next();
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + req.headers.host + req.url);
        }
    });
}

// compress all requests
app.use(compression());

app.use('/', express.static('client/build', {cacheControl: false}));
// app.use('/', express.static('public', {maxage: config.maxAge})); // obsolete, lefr for reference

// override with POST having ?_method=DELETE or PUT
app.use(methodOverride('_method'))

if (SbUtils.isProdOrStaging()) app.set('trust proxy', 1); // trust first proxy, a MUST on heroku

mongoose.connect(config.mongodb_uri);
mongoose.set('debug', true);

// app.use(require('express-domain-middleware')); // For error handling
// // General error handler - bad practice, exist for understanding
// process.on('uncaughtException', function(err) {
//   console.log("process.on('uncaughtException) - Caught exception: " + err);
// });


// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
    limit: '256kb',
    parameterLimit: 100,
    extended: true
}));

app.use(bodyParser.json()); // parse application/json

// connect to rabbit
let ampq = AmpqConn.getDefaultConnection({connType: 'publisher'});

app.use(function (req, res, next) {
  console.log('START req url ' + req.url + ' method=' + req.method + ' Time:', new Date().toISOString());
  next();
});


console.log('load phase', 10, moment().toString());
(function(){
    // create admin usr
    let User = require('./backend/models/user');
    User.findByUsername(Consts.ADMIN_USER).then(function (user) {
        if (user) {
            console.log("got admin user")
        }else{
            console.log('created initial admin user');
            let admin = new User({
                username: Consts.ADMIN_USER,
                password: process.env.ADMIN_USER_PW || '1'
            });

            admin.save(err=> {
                if (err) {
                    console.log('error while user ADMIN register!', err);
                } else {
                    console.log('ADMIN user registered!');
                }
            });
        }
    });
})();


let AuthMgr = require(global.__base + "/backend/utils/auth");
AuthMgr.hookMiddleware(app);

// earlier on expose an object that we can tack properties on.
// all res.locals props are exposed to the templates, so it will be present.
app.use(function(req, res, next){
    console.log("params", req.params, "body", _.isUndefined(req.body.dataFromFile) ? req.body : 'body from file, too big to dump', "query", req.query);
    res.locals.config_env = process.env.NODE_ENV || 'development';

    res.locals.sbData = {}

    next();

});


console.log('load phase', 20, moment().toString());
app.get('/clear', function(req, res) {
    res.redirect('/login');

});

app.use('/api', require("./backend/routers/login")('/api'));
// REST routers
AuthMgr.requireAuth(app, '/api/users', "backend/routers/users");
AuthMgr.requireAuth(app, '/api/admin', "backend/routers/admin");
AuthMgr.requireAuth(app, '/api', "backend/routers/research");
//////////////////////////////////

// to simulate error catcher - 
app.get('/error', function(req, res){
  bb;
});

// handle every client route with index.html, which will contain
// a script tag to your application's JavaScript file(s).
app.get(
    "market security category institution issuer users admin".split(/\s+/).map(e=>`(/${e})|(/${e}/*)`),
    function (res, res) {
    res.setHeader("Cache-Control","max-age=0,must-revalidate");
    res.sendFile(path.resolve('client', 'build', 'index.html'));
});

console.log('load phase', 30, moment().toString());

app.use(function (req, res, next) {
  console.log('END req url' + req.url + ' Time:', new Date().toISOString());
  next();
});


app.use(function errorHandler(err, req, res, next) {
  console.log('error on request %d %s %s: %j\n\tMsg: %s\n\tStack: %s', process.domain && process.domain.id || 'no domain?!',
    req.method, req.url, SbUtils.shallowStringify(err), err.message, err.stack);
  res.status(500).send("Error. Please contact info@smartbull.co.il");
});

server.listen(process.env.PORT || 8000, process.env.IP || "0.0.0.0", function(){
  let addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});


