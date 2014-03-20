

let Q = require("q");
let mongoose = require('mongoose');
let express = require('express');
let _ = require('lodash');
let moment = require('moment-timezone');
let util = require('util');

let Consts = require(global.__base + "/backend/utils/consts.js");
let SbUtils = require(global.__base + "/backend/utils/SbUtils.js");
let DbUtils = require(global.__base + "/backend/utils/db_utils.js");

let AmpqConn = require(global.__base + '/backend/utils/ampq_conn.js')

class MigrationsWorker {
    constructor(msgParams) {
        this.msgParams = msgParams;
    }

    async run(){
        try{

            switch (this.msgParams.migrationType){
                case 'refreshForeignHoldings':
                    await this.refreshForeignHoldings()
                    console.log("refreshForeignHoldings done");
                    break;
                case 'refreshGovHoldings':
                    await this.refreshGovHoldings()
                    console.log("refreshGovHoldings done");
                    break;
                default:
                    const errMsg = `ERROR unknown migrationType ${this.msgParams.migrationType}`;
                    console.log(errMsg)
            }
        }catch(err){
            console.log("ERROR MigrationsWorker", err)
            throw err;
        }
    }
                        
    async refreshForeignHoldings(){
        let ForeignHoldings = require(global.__base + "/backend/models/foreign_holdings");
        const foreignHoldings = new ForeignHoldings();

        const feInitSuccess = await foreignHoldings.init(
            'dont care',
            {allowCache:false, saveToCache: true, clearCache: true});

        if (!feInitSuccess) {
            this.migrationInProgress.reject('failed to load ForeignHoldings');
            return;
        }

        const foreignHoldingsRaw= foreignHoldings.getProcessedData();
        console.log(`got ${_.size(foreignHoldingsRaw)} holdings`);

        return true;
    }

    async refreshGovHoldings(){
        let GovHoldings = require(global.__base + '/backend/models/gov_holdings');
        const govHoldings = new GovHoldings();

        const ghInitSuccess = await govHoldings.init(
            {allowCache:false, saveToCache: true, clearCache: true}
        );
        if (!ghInitSuccess) {
            this.migrationInProgress.reject('failed to load GovHoldings');
            return;
        }

        console.log(`got ${_.size(govHoldings.getRawData())} gov holdings`);

        return true;
    }

}

module.exports = MigrationsWorker;
