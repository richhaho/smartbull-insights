
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

const ForeignHoldingsDataType = {
    MutualFund: 'MutualFund',
    ETF: 'ETF',
};

class ForeignHoldings{
    constructor(){
        this.initialized = false;

        this.DB_COLS = {
            raw: Consts.DB_COLS.FOREIGN_HOLDINGS_RAW,
            processed: Consts.DB_COLS.FOREIGN_HOLDINGS,
            processErrors: Consts.DB_COLS.FOREIGN_HOLDINGS_PROCESS_ERRORS,
            sums: Consts.DB_COLS.FOREIGN_HOLDINGS_SUMS,
        };

        this.allPeriods = {
            Q1_2017: '2017-Q1',
            Q2_2017: '2017-Q2',
            Q3_2017: '2017-Q3',
            Q4_2017: '2017-Q4',
            Q1_2018: '2018-Q1',
        };
        this.allPeriodsInverted = _.invert(this.allPeriods);
        this.periodsOrdered = _.values(this.allPeriods);

        this.COL_MAPPING = {
            reportingPeriod: 'Reporting Period',
            reportingInstitution: 'Reporting Institution',
            inst: 'Parent Company',
            instType: 'Institution Type',
            managingCompany: 'Managing Company',
            isin: 'Security Official ID',//isin
            secName: 'Security Official Name',
            securityOfficialType: 'Security Official Type',
            issuer: 'Issuer Name',
            category: 'Category',
            assetClass: 'Asset Class',
            currency: 'Currency',
            units: 'Units',
            priceUsd: 'Price USD',
            usdConversionRate: 'USD Conversion Rate',
            marketValueUsd: 'Market Value USD',

            securityTicker: 'Security Ticker',
            index: 'Index',
            secNameIsin: 'Security Name / isin', //todo kill it
        }
        this.NUMERIC_COLS = [
            this.COL_MAPPING.units,
            this.COL_MAPPING.priceUsd,
            this.COL_MAPPING.usdConversionRate,
            this.COL_MAPPING.marketValueUsd,
        ];
        this.STRING_COLS = _.difference(_.values(this.COL_MAPPING), this.NUMERIC_COLS)
            .filter(col=>col !== this.COL_MAPPING.secNameIsin);

        this.PIVOT_COLS = [this.COL_MAPPING.isin, this.COL_MAPPING.inst, this.COL_MAPPING.instType];

        this.INVALID_VALS = ['#N/A', ''];

        this.INST_TYPES= {
            Pension: 'Pension',
            Insurance: 'Insurance',
            Gemel: 'Gemel',
            MutualFund: 'Mutual Fund'
        }

        this.SECURITY_OFFICIAL_TYPES = {
            ETF: 'ETF',
            indexFund: 'Index Fund',
            mutualFund: 'Mutual Fund',
            hedgeFund: 'Hedge Fund',
            fundOfDunds: 'Fund of Funds',
        }

        this.SECURITY_OFFICIAL_TYPES_MUTUAL_FUNDS = [this.SECURITY_OFFICIAL_TYPES.mutualFund];
        this.SECURITY_OFFICIAL_TYPES_ETFS = _.difference(
                _.values(this.SECURITY_OFFICIAL_TYPES, this.SECURITY_OFFICIAL_TYPES_MUTUAL_FUNDS));
    }

    async _initFromGGSheets(){
        let ggFormatToRows = ((data, srcDesc)=>{
            if (!data){
                return [];
            }

            const
                values = data.values,
                headers = values.shift().map(hdr=>hdr.trim().replace(/(^["'])|(["']$)/g, ""));
            // console.log("headers",headers)

            return values.map((row,rowI)=>{
                const zipped = _.zipObject(headers, row);
                zipped.srcRowIndex = rowI + 2; // gg sheet offset
                zipped.src = srcDesc;
                return zipped;
            });
        });





        const
            mutualFundsInstHoldings = ggFormatToRows(
                await sheetsApiMgr.readForeignMutualFundsInstHoldings(), 'FOREIGN_MUTUAL_FUNDS_INST'),
            etfInstsHoldings = ggFormatToRows(
                await sheetsApiMgr.readForeignEtfInstsHoldings(), 'FOREIGN_ETF_INST'),
            etfMutualFundsHoldings = ggFormatToRows(
                await sheetsApiMgr.readForeignEtfMutualFundsHoldings(), 'FOREIGN_ETF_MUTUAL_FUNDS');


        return [
            ...mutualFundsInstHoldings,
            ...etfInstsHoldings,
            ...etfMutualFundsHoldings
        ];
    }

    async init(foreignHoldingsDataType = ForeignHoldingsDataType.MutualFund,
               {allowCache = true, saveToCache = true, clearCache = false}= {}){
        if (this.initialized){
            return true;
        }
        this.initialized = true;

        let fromCache = false;
        const db = mongoose.connection;
        console.log('init params', {allowCache, saveToCache, clearCache})
        if (clearCache){
            console.log('rowData: clearing cache');
            [this.DB_COLS.raw, this.DB_COLS.processed, this.DB_COLS.processErrors, this.DB_COLS.sums]
                .forEach(async colName => (await DbUtils.dropCollection(colName)))
        }

        if (allowCache){
            const processedCollection = db.collection(this.DB_COLS.processed).find({});
            this.processedData = processedCollection && (await processedCollection.toArray());
            console.log(`rowData: got from cache ${_.size(this.processedData)} rows`)
            fromCache = _.some(this.processedData);
        }

        let rawData;
        if (!fromCache){
            const startTime = new Date();
            rawData = await this._initFromGGSheets();
            console.log(`rowData: got from gg ${_.size(rawData)} rows, started ${moment(startTime).fromNow()} (${new Date() - startTime})`)
            this._processRawData(rawData);
        }

        if (this.processedData && !fromCache && saveToCache){
            const formerDebugFlag = mongoose.get('debug');
            mongoose.set('debug', false);

            console.log(`rowData: writing to cache ${_.size(this.processedData)} rows`)
            await db.collection(this.DB_COLS.raw).insertMany(rawData);
            await db.collection(this.DB_COLS.processed).insertMany(this.processedData);
            await db.collection(this.DB_COLS.processErrors).insertOne(this.processErrors);
            await db.collection(this.DB_COLS.sums).insertOne(this.sumsPerSrc);

            mongoose.set('debug', formerDebugFlag);

        }

        return true;

    }

    _isInvalidVal(v){
        return this.INVALID_VALS.includes(v);
    }
    _processRawData(rawData) {
        const COLS = this.COL_MAPPING;
        let sumsPerSrc = {};

        // console.log("COLORTEAL first row", this.processedData[0])
        let postProcessErrors = {
                pivotMissing: [],
                normalize: {},
                mismatches: {},
                mismatchesByField: {},
                mismatchCountByField: {},
                unknownKeys: {},
            },
            smallPriceDiff = 0;
        rawData.forEach((row, rowI) => {
            let _normalize = (fld, cb)=>{
                const val = row[fld];
                if (!_.isString(val)){
                    switch (fld){
                        case this.COL_MAPPING.securityTicker:
                        case this.COL_MAPPING.index:
                            if (row.src === 'FOREIGN_MUTUAL_FUNDS_INST'){
                                break;// special case, not really missing
                            }
                        default:
                            postProcessErrors.normalize[rowI] = postProcessErrors.normalize[rowI] || [];
                            postProcessErrors.normalize[rowI].push(fld)
                    }
                }else{
                    cb(val);
                }

            }
            this.NUMERIC_COLS.forEach(fld => _normalize(fld, (val=>row[fld] = SbUtils.toNum(val))));
            this.STRING_COLS.forEach(fld => _normalize(fld, (val=>row[fld] = val.trim())));

            if (_.some(this.PIVOT_COLS, pivotFld=>this._isInvalidVal(row[pivotFld]))){
                row.invalid = true;
                postProcessErrors.pivotMissing.push(row);
            }
        });

        rawData = rawData.filter(row=>!row.invalid);

        rawData.forEach(row => {
            row[COLS.secNameIsin] = `${row[COLS.secName]} (${row[COLS.isin]})`;

            const
                period = row[COLS.reportingPeriod],
                value = row[COLS.marketValueUsd],
                secType = row[COLS.securityOfficialType],
                src = row.src;

            let s = sumsPerSrc[src];
            if (!s) {s = sumsPerSrc[src] = {}}
            let sp = s[period];
            if (!sp) {sp = s[period] = {}}

            if (!sp[secType]) {sp[secType] = 0}
            sp[secType] += value;
        })
        // console.log(JSON.stringify(sumsPerSrc, undefined, 2));


        const
            normalizeInstType = (val) => {
                switch (val) {
                    default: // mmm
                        console.log(`ERROR unknown inst type ${val}`)
                    case this.INST_TYPES.MutualFund:
                        return 'Short term (Mutual Funds)';
                    case this.INST_TYPES.Pension:
                    case this.INST_TYPES.Insurance:
                    case this.INST_TYPES.Gemel:
                        return 'Long Term (Pension, Gemel, Insurance)';

                }
            },
            calcPivotVal = row => [
                        row[COLS.isin],
                        row[COLS.inst],
                        normalizeInstType(row[this.COL_MAPPING.instType])
                ].join('||'),
            checkAndHandleMismatchError = (
                {pivotVal, srcRowsIndex, holdingId, fld, fldDesc, allowDiffRatio, oldVal, newVal} = {}) => {

                let mismatch = oldVal !== newVal;
                if (mismatch && allowDiffRatio){
                    const
                        diff = Math.abs(oldVal - newVal),
                        bigger = Math.max(oldVal, newVal),
                        diffRatio = diff / bigger;
                    mismatch = diffRatio > allowDiffRatio;
                    if (!mismatch){
                        smallPriceDiff += 1;
                    }else{
                        // console.log(`smallPriceDiff`, JSON.stringify({oldVal, newVal, diff, bigger, diffRatio}))
                    }
                }
                if (mismatch){
                    const fldOrFldDesc = fld || fldDesc;
                    let mismatchRecord;
                    postProcessErrors.mismatches[pivotVal] = postProcessErrors.mismatches[pivotVal] || {};
                    postProcessErrors.mismatchesByField[fldOrFldDesc] = postProcessErrors.mismatchesByField[fldOrFldDesc] || {};

                    mismatchRecord = postProcessErrors.mismatches[pivotVal][fldDesc];
                    if (!mismatchRecord){
                        mismatchRecord = {vals: [oldVal], rows: srcRowsIndex, _id: holdingId}
                        postProcessErrors.mismatches[pivotVal][fldDesc] = mismatchRecord;
                        postProcessErrors.mismatchesByField[fldOrFldDesc][pivotVal] = mismatchRecord;
                    }
                    mismatchRecord.vals.push(newVal);

                    postProcessErrors.mismatchCountByField[fldOrFldDesc] =
                        postProcessErrors.mismatchCountByField[fldOrFldDesc] || 0;
                    postProcessErrors.mismatchCountByField[fldOrFldDesc] += 1;
                    return true;
                }
                return false;
            }

        let addCurrHoldingToAggregatedHolding = (aggregatedHolding, currHolding, pivotVal)=>{
            let reportingPeriodData = {},
                reportingPeriod = currHolding[COLS.reportingPeriod];
            const {srcRowIndex, src} = currHolding;
            aggregatedHolding.srcRowsIndex.push([src, srcRowIndex].join('||'));
            // each holding is a reporting period data of that pivot val holder (eg US78462F1030||Modelim||Short term (Mutual Funds))
            _.forEach(currHolding, (currFieldVal, currFld)=>{
                switch (currFld){
                    // reportingPeriodData fields
                    case COLS.units:
                    case COLS.priceUsd:
                    case COLS.usdConversionRate:
                    case COLS.marketValueUsd:
                        reportingPeriodData[currFld] = currFieldVal;
                        break;
                    // aggregation fields
                    case COLS.reportingInstitution:
                    case COLS.instType:
                        if (_.isUndefined(aggregatedHolding[currFld])){
                            aggregatedHolding[currFld] = [currFieldVal];
                        }else if (!aggregatedHolding[currFld].includes(currFieldVal)){
                            aggregatedHolding[currFld].push(currFieldVal);
                        }
                        break;
                    // same value field
                    case COLS.inst:
                    case COLS.managingCompany:
                    case COLS.isin:
                    case COLS.secName:
                    case COLS.securityOfficialType:
                    case COLS.issuer:
                    case COLS.category:
                    case COLS.assetClass:
                    case COLS.currency:
                    case COLS.secNameIsin:
                    case COLS.index: // not for mutual funds
                    case COLS.securityTicker: // not for mutual funds
                        if (_.isUndefined(aggregatedHolding[currFld])){
                            aggregatedHolding[currFld] = currFieldVal;
                        }else if (checkAndHandleMismatchError(
                                {pivotVal, srcRowsIndex: aggregatedHolding.srcRowsIndex,
                                    holdingId: aggregatedHolding._id, fldDesc: currFld,
                                    oldVal: aggregatedHolding[currFld], newVal: currFieldVal})){
                            if (this._isInvalidVal(aggregatedHolding[currFld])){
                                aggregatedHolding[currFld] = currFieldVal;//new val is better
                            }
                        }
                        break;
                    // ignore fields
                    case '_id':
                    case 'src':
                    case 'srcRowIndex':
                    case COLS.reportingPeriod: // handled specifically
                        break;
                    default:
                        postProcessErrors.unknownKeys[pivotVal] =
                            postProcessErrors.unknownKeys[pivotVal] || [];
                        postProcessErrors.unknownKeys[pivotVal].push({unknown: currFld, srcRowsIndex: aggregatedHolding.srcRowsIndex})

                }
            });

            // add/merge the reporting period data
            if (aggregatedHolding[reportingPeriod]){
                // already has a reporting data for this one, merge
                aggregatedHolding[reportingPeriod][COLS.units] += reportingPeriodData[COLS.units];
                aggregatedHolding[reportingPeriod][COLS.marketValueUsd] += reportingPeriodData[COLS.marketValueUsd];
                [COLS.priceUsd, COLS.usdConversionRate].forEach(currFld=>{
                    checkAndHandleMismatchError(
                        {pivotVal, srcRowsIndex: aggregatedHolding.srcRowsIndex,
                            holdingId: aggregatedHolding._id,
                            fld: currFld, fldDesc: [reportingPeriod, currFld].join('||'),
                            allowDiffRatio: currFld === COLS.priceUsd ? 0.025 : undefined,
                            oldVal: aggregatedHolding[reportingPeriod][currFld], newVal: reportingPeriodData[currFld]});
                });

            }else{
                aggregatedHolding[reportingPeriod] = reportingPeriodData;
            }
        }

        // DO THE PIVOT
        this.processedData =
            _.chain(rawData)
            .groupBy(calcPivotVal)
            .map((currPivotValHoldings, pivotVal) => {
                let aggregatedHolding = {srcRowsIndex: [], _id: new mongoose.Types.ObjectId()};
                currPivotValHoldings.forEach(currHolding=>
                    addCurrHoldingToAggregatedHolding(aggregatedHolding, currHolding, pivotVal));
                // temp thing, until we need smtng else - join the aggregated fields to string
                [COLS.reportingInstitution, COLS.instType].forEach(fld=>
                    aggregatedHolding[fld] = aggregatedHolding[fld].join('||'));
                return aggregatedHolding;
            })
            .valueOf();
        this.processErrors = postProcessErrors;
        this.sumsPerSrc = sumsPerSrc;

        const stats = {
            smallPriceDiff,
            'total rows': this.processedData.length,
            'count per reporting periods': this.periodsOrdered.reduce((acc, e)=>{
                acc[e] = 0;
                return acc;
            }, {})
        };

        [COLS.isin, COLS.inst].forEach(fld=>{
            stats[`uniq ${fld}s`] = _.chain(this.processedData).map(fld).uniq().valueOf().length;
        })

        
        this.processedData.forEach(row=>{
            this.periodsOrdered.forEach(period=>{
                if (row[period]){
                    stats['count per reporting periods'][period] += 1;
                }
            })
        })
        postProcessErrors.stats = stats;

        const totalErrorsCount = _.chain(postProcessErrors).values().sumBy(_.size).valueOf();
        if (totalErrorsCount > 0){
            console.log(`ERROR total post process errors ${totalErrorsCount}`);
            _.forEach(postProcessErrors, (v,k)=>console.log(`${k} count ${_.size(v)}`))
            if (!SbUtils.isProdOrStaging()) {
                console.log(JSON.stringify(postProcessErrors, undefined, 2));
            }
        }
    }

    getProcessedData() {return this.processedData;}
    async getRawDataProcessingErrors() {
        if (!this.processErrors){
            this.processErrors = await mongoose.connection.collection(this.DB_COLS.processErrors).findOne({});
        }
        return this.processErrors;
    }

    async getRawDataSums() {
        if (!this.sumsPerSrc){
            this.sumsPerSrc = await mongoose.connection.collection(this.DB_COLS.sums).findOne({});
        }
        return this.sumsPerSrc;
    }


}

module.exports = ForeignHoldings;
