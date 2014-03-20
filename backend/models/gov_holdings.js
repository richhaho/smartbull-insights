
let Q = require("q");

let moment = require('moment'),
    _ = require('lodash'),
    numeral = require('numeral');

let mongoose = require('mongoose');

let config = require(global.__base + "/backend/config.js"),
    Consts = require(global.__base + "/backend/utils/consts"),
    SbUtils = require(global.__base + "/backend/utils/SbUtils"),
    DbUtils = require(global.__base + "/backend/utils/db_utils");


let sheetsApiMgr = require(global.__base + "/backend/utils/gg_sheets");

class GovHoldings{
    constructor(){
        this.initialized = false;

        this.COL_MAPPING = {
            month: 'Month',
            gemel: 'Gemel',
            pension: 'Pension',
            insurance: 'Insurance'
        }
        this.NUMERIC_COLS = [
            this.COL_MAPPING.gemel,
            this.COL_MAPPING.pension,
            this.COL_MAPPING.insurance
        ];
    }

    async _initFromGGSheets(){
        const data = await sheetsApiMgr.readGovTotals();

        if (!data){
            return null;
        }

        const
            values = data.values,
            headers = values.shift()
                .map(hdr=>hdr.trim().replace(/(^["'$])|(["']$)/g, ""))
                .filter(hdr=>hdr !== '');
        // console.log("headers gov holdings",headers)

        this.rawData = values.map(row=>_.zipObject(headers, row));

        return true;
    }

    async init({allowCache = true, saveToCache = true, clearCache = false}= {}){
        if (this.initialized){
            return true;
        }

        this.initialized = true;

        let fromCache = false;
        const db = mongoose.connection;

        console.log('init params', {allowCache, saveToCache, clearCache})
        if (clearCache){
            console.log('rowData: clearing cache')
            await DbUtils.dropCollection(Consts.DB_COLS.GOV_HOLDINGS_RAW);
        }

        if (allowCache){
            const dbQuery = db.collection(Consts.DB_COLS.GOV_HOLDINGS_RAW).find({});
            this.rawData = dbQuery && (await dbQuery.toArray());
            console.log(`rowData: got from cache ${_.size(this.rawData)} rows`)
            fromCache = _.some(this.rawData);
        }

        if (!fromCache){
            await this._initFromGGSheets();
            console.log(`rowData: got from gg ${_.size(this.rawData)} rows`)
        }

        if (this.rawData && !fromCache && saveToCache){
            console.log(`rowData: writing to cache ${_.size(this.rawData)} rows`)
            await db.collection(Consts.DB_COLS.GOV_HOLDINGS_RAW).insertMany(this.rawData);
        }

        this._postProcessRawData();

        return true;

    }

    _postProcessRawData() {
        // console.log("_postProcessRawData", this.rawData);
        this.rawData.forEach(row => {
            this.NUMERIC_COLS.forEach(fld => {
                row[fld] = SbUtils.toNum(row[fld]);
            });
        });

    }

    getRawData() {return this.rawData;}
}

module.exports = GovHoldings;
