global.__base = __dirname + '/';

let Consts = require(global.__base + "/backend/utils/consts.js");
let config = require(global.__base + "/backend/config.js");
let SbUtils = require(global.__base + "./backend/utils/SbUtils.js")

let moment = require('moment');
let _ = require('lodash');

let Q = require("q");
if (SbUtils.isDevelopment()) process.env.Q_DEBUG=1;
Q.props = obj => {
    const ps = Q.all(Object.keys(obj).map(x => Q.all([x, obj[x]])));
    return ps.then(x => x.reduce((p, c) => {p[c[0]] = c[1]; return p } , {}));
};

let mongoose = require('mongoose');
mongoose.Promise = require("q").Promise;

let AmpqConn = require(global.__base + '/backend/utils/ampq_conn.js')

let http = require('http');
let throng = require('throng');

let workersRegistry = require(global.__base + 'backend/workers/workers_registry.js');

console.log('worker starting...')

mongoose.connect(config.mongodb_uri);
mongoose.set('debug', true);

http.globalAgent.maxSockets = Infinity;

function start() {
    console.log({
        type: 'info',
        msg: 'starting worker',
        concurrency: 1
    });

    process.on('SIGTERM', shutdown);

    function shutdown() {
        console.log({ type: 'info', msg: 'shutting down' });
        process.exit();
    }

    let ampq = AmpqConn.getDefaultConnection({connType: 'worker', workerDispatcher: workersRegistry.dispatchMsg});

}


throng(1, start);

console.log('worker STARTED')


