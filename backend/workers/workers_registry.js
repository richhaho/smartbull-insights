
let moment = require('moment');
let Q = require("q");
let mongoose = require('mongoose');
mongoose.Promise = require("q").Promise;
let _ = require('lodash');


let Consts = require(global.__base + "/backend/utils/consts.js");
// let config = require(global.__base + "/backend/config.js");
// let SbUtils = require(global.__base + "./backend/utils/SbUtils.js")


let MigrationsWorker = require(global.__base + 'backend/workers/migrations_worker');

class WorkersRegistry {
    constructor(opts) {

    }

    async dispatchMsg(msg){
        console.log('WorkersRegistry::dispatchMsg - got msg, sz', _.size(msg))

        const msgParams = JSON.parse(msg.content.toString());
        if (msg) {
            let jobHandler;
            switch (msgParams.jobType) {
                case Consts.WORKER_JOBS.SOME_MAIL:
                    // jobHandler = new MailSenderWorker(msgParams);
                    break;
                case Consts.WORKER_JOBS.MIGRATE:
                    jobHandler = new MigrationsWorker(msgParams);
                    break;
                default:
                    const msg = 'ERROR failed to dispatch msg';
                    console.error(msg, msgParams)
            }

            if (jobHandler) {
                try {
                    const jobRes = await jobHandler.run();
                    console.log(`worker ${msgParams.jobType} done`, jobRes)
                    return true; // all good!
                } catch (err) {
                    console.log(`ERROR in WorkersRegistry::dispatchMsg "${err.message}"`, err.stack);
                }
            }
        }

        return false; // not handled!


    }

}

module.exports = new WorkersRegistry({}); // Sinsgleton
