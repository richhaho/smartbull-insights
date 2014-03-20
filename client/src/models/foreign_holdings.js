
// importing all lodash is bad practice.
// need to fix this in this file and NOT copy it elsewhere.
// problem is _.chain, need to figure this one (flow?)
import _ from 'lodash'

import {SBConsts} from 'services/sb-consts'

const ForeignHoldingsDataType = {
    MutualFund: 'MutualFund',
    ETF: 'ETF',
};

// shorter to write :)
const COLS = {
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
    secNameIsin: 'Security Name / isin', //todo kill it
};

class ForeignHoldings{
    isQuartly(period){
        return /Q[1-4]$/.test(period);
    }

    constructor(){
        '_av _cv _cpv _acvDiff _cpvDiff'.split(' ')
            .forEach(funcName=> this[funcName] = this[funcName].bind(this));

        this.shortTermPeriods = {
            M1_2018: '1-2018',
            M2_2018: '2-2018',
            M3_2018: '3-2018',
        }
        this.shortTermPeriodsInverted = _.invert(this.shortTermPeriods);
        this.shortTermPeriodsOrdered = _.values(this.shortTermPeriods).reverse();

        this.longTermPeriods = {
            Q1_2017: '2017-Q1',
            Q2_2017: '2017-Q2',
            Q3_2017: '2017-Q3',
            Q4_2017: '2017-Q4',
            Q1_2018: '2018-Q1',
        };
        this.longTermPeriodsInverted = _.invert(this.longTermPeriods);
        this.longTermPeriodsOrdered = _.values(this.longTermPeriods).reverse();


        this.allPeriods = _.merge(this.longTermPeriods, this.shortTermPeriods);
        this.allPeriodsInverted = _.invert(this.allPeriods);
        this.periodsOrdered = [
            this.longTermPeriods.Q1_2018,
            this.shortTermPeriods.M3_2018,
            this.shortTermPeriods.M2_2018,
            this.shortTermPeriods.M1_2018,
            this.longTermPeriods.Q4_2017,
            this.longTermPeriods.Q3_2017,
            this.longTermPeriods.Q2_2017,
            this.longTermPeriods.Q1_2017,
        ];

        this.periodToDisplayName = this.periodsOrdered.reduce(
            (h, period) => {
                h[period] = (this.isQuartly(period)) ?
                    period.split('-').reverse().join(', '):
                    period.split('-').join('/');
                return h;
            }, {});

        this.periodToShortDisplayName = this.periodsOrdered.reduce(
            (h, period) => {
                if (this.isQuartly(period)){
                    h[period] = period.split('-')[1];
                }else{
                    h[period] = period.split('-')[0];
                }

                return h;
            }, {});

        this.COL_MAPPING = COLS;

        this.INVALID_VALS = ['#N/A', ''];
        this.VALUE_DIFF_MEANINGFUL_THRESHOLD_USD= 0.5 * SBConsts.Million;
        this.VALUE_DIFF_MEANINGFUL_THRESHOLD_RATE = 0.01;
        this.VALUE_DIFF_MIN_THRESHOLD_USD = 100000;

        this.CHANGE_DISPLAY_MIN_USD = 100000;

        this.NUMERIC_COLS = [
            this.COL_MAPPING.units,
            this.COL_MAPPING.priceUsd,
            this.COL_MAPPING.usdConversionRate,
            this.COL_MAPPING.marketValueUsd,
        ];

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
            fundOfFunds: 'Fund of Funds',
        }

        this.SECURITY_OFFICIAL_TYPES_MUTUAL_FUNDS = [this.SECURITY_OFFICIAL_TYPES.mutualFund];
        this.SECURITY_OFFICIAL_TYPES_ETFS = [this.SECURITY_OFFICIAL_TYPES.ETF, this.SECURITY_OFFICIAL_TYPES.indexFund];

        this.EVENTS = {
            PERIOD_CHANGE: 'PERIOD_CHANGE',
            SEC_TYPE_CHANGE: 'SEC_TYPE_CHANGE',
        }
        this.listeners = _.values(this.EVENTS).reduce((acc,e)=>{
            acc[e] = [];
            return acc;
        }, {});

        // defaults!
        this.foreignHoldingsDataType = ForeignHoldingsDataType.MutualFund;
        this.setPeriods({
            dontPublish: true,
            activePeriod: this.allPeriods.Q1_2018,
        });
    }



    init(rawData, {colorFunc, rawDataProcessingErrors, rawDataSums, foreignHoldingsDataType, activePeriod}){
        this.colorFunc = colorFunc || (diff=>'black');
        this.rawDataProcessingErrors = rawDataProcessingErrors;
        this.rawDataSums = rawDataSums;

        this.allRawData = rawData;
        if (foreignHoldingsDataType){
            this.foreignHoldingsDataType = foreignHoldingsDataType;
        }
        if (activePeriod){
            this.setPeriods({activePeriod, dontPublish: true});
        }
        this._applyFilters();
    }

    changeForeignHoldingsDataType(foreignHoldingsDataType) {
        const prev = this.foreignHoldingsDataType;
        this.foreignHoldingsDataType = foreignHoldingsDataType;
        this._applyFilters();

        if (_.some(this.listeners.SEC_TYPE_CHANGE)) {
            console.log(`publishing ${this.EVENTS.SEC_TYPE_CHANGE} for ${this.listeners.SEC_TYPE_CHANGE.length} listeners`);
            this.listeners.SEC_TYPE_CHANGE.forEach(cb => cb({
                context: this,
                type: this.EVENTS.SEC_TYPE_CHANGE,
                from: prev,
                to: foreignHoldingsDataType
            }));
        }
    }

    getForeignHoldingsDataType(){
        switch (this.foreignHoldingsDataType){
            default:
                throw new Error(`ERROR - unrecognized ${this.foreignHoldingsDataType}`);
            case ForeignHoldingsDataType.MutualFund:
                return 'Foreign Mutual Funds'
            case ForeignHoldingsDataType.ETF:
                return 'Foreign ETFs'

        }
    }

    _initInternalDataStructs() {
        this.bySecurityName = _.groupBy(this.rawData, this.COL_MAPPING.secName);
        this.bySecurityNameIsin = _.groupBy(this.rawData, this.COL_MAPPING.secNameIsin);
        this.byIsin = _.groupBy(this.rawData, this.COL_MAPPING.isin);
        this.byInstName = _.groupBy(this.rawData, this.COL_MAPPING.inst);
        this.perCategory = _.groupBy(this.rawData, this.COL_MAPPING.category);
        this.byIssuer = _.groupBy(this.rawData, this.COL_MAPPING.issuer);
        this.byManagingCompany = _.groupBy(this.rawData, this.COL_MAPPING.managingCompany);
    }

    clear(){
        this.rawData = null;
        this.rawDataProcessingErrors = null;

        this.bySecurityName = null;
        this.bySecurityNameIsin = null;
        this.byIsin = null;
        this.byInstName = null;
        this.perCategory = null;
        this.byIssuer = null;
    }

    addEventListener(eventType, callback){
        this.listeners[eventType].push(callback);
    }

    removeEventListener(eventType, callback){
        _.pull(this.listeners[eventType], callback);
    }

    _applyFilters(){
        if (!this.allRawData){
            // loading time..
            this.rawData = [];
            return;
        }
        let filtered = this.allRawData;

        // const {foreignHoldingsDataType, activePeriod} = this;
        // console.log(`start  ${filtered.length} ${foreignHoldingsDataType}, ${activePeriod}`);

        if (this.foreignHoldingsDataType === ForeignHoldingsDataType.MutualFund) {
            filtered = filtered.filter(row =>
                row[this.COL_MAPPING.securityOfficialType] === this.SECURITY_OFFICIAL_TYPES.mutualFund);
        } else {
            filtered = filtered.filter(row =>
                this.SECURITY_OFFICIAL_TYPES_ETFS.includes(row[this.COL_MAPPING.securityOfficialType]));
        }
        // console.log(`post foreignHoldingsDataType ${filtered.length}`);

        if (this.isQuartly(this.activePeriod)){
            filtered = filtered.filter(row =>
                row[this.COL_MAPPING.instType] !== this.INST_TYPES.MutualFund);
        }else{
            filtered = filtered.filter(row =>
                row[this.COL_MAPPING.instType] === this.INST_TYPES.MutualFund);
        }
        // console.log(`post activePeriod ${this.activePeriod} ${filtered.length}`);


        this.rawData = filtered;

        this._initInternalDataStructs();

    }

    setPeriods({activePeriod, compareToPeriod, compareToPrevPeriod, dontPublish}){
        const
            isQuartly = this.isQuartly(activePeriod),
            prev = this.activePeriod,
            periodsOrdered = isQuartly ?
                this.longTermPeriodsOrdered :
                this.shortTermPeriodsOrdered,
            activePeriodIndex = periodsOrdered.indexOf(activePeriod);
        if (!compareToPeriod){
            compareToPeriod = activePeriodIndex+1 < periodsOrdered.length ? periodsOrdered[activePeriodIndex+1] : 'N/A';
        }
        if (!compareToPrevPeriod){
            compareToPrevPeriod = activePeriodIndex+2 < periodsOrdered.length ? periodsOrdered[activePeriodIndex+2] : 'N/A';
        }

        this.activePeriod = activePeriod;
        this.compareToPeriod = compareToPeriod;
        this.compareToPrevPeriod = compareToPrevPeriod;

        this.activePeriodTypeDisplayName = this.isQuartly(this.activePeriod) ? 'Quarterly' : 'Monthly'
        this.activePeriodDisplayName = this.periodToDisplayName[this.activePeriod];
        this.compareToPeriodDisplayName = this.periodToDisplayName[this.compareToPeriod];
        this.activePeriodShortDisplayName = this.periodToShortDisplayName[this.activePeriod];
        this.compareToPeriodShortDisplayName = this.periodToShortDisplayName[this.compareToPeriod];
        this.activeAndPrevPeriodsComparisonDesc =
            this.periodToShortDisplayName[this.compareToPeriod] + '/' +
            this.periodToShortDisplayName[this.activePeriod];

        if (dontPublish){
            return;
        }
        this._applyFilters();

        if (_.some(this.listeners.PERIOD_CHANGE)) {
            console.log(`publishing ${this.EVENTS.PERIOD_CHANGE} for ${this.listeners.PERIOD_CHANGE.length} listeners`);
            this.listeners.PERIOD_CHANGE.forEach(cb => cb({
                context: this,
                type: this.EVENTS.PERIOD_CHANGE,
                from: prev,
                to: activePeriod
            }));
        }
    }

    _av(holding){return this.getHoldingPeriodVal(holding, this.activePeriod);}
    _cv(holding){return this.getHoldingPeriodVal(holding, this.compareToPeriod);}
    _cpv(holding){return this.getHoldingPeriodVal(holding, this.compareToPrevPeriod);}
    _acvDiff(holding) {
        if (holding.aggregatedDiffUSD){
            return holding.aggregatedDiffUSD;
        }
        
        return this.getHoldingPeriodsDiffVal(holding, this.activePeriod, this.compareToPeriod);
    }
    _cpvDiff(holding) {
        return this.getHoldingPeriodsDiffVal(holding, this.compareToPeriod, this.compareToPrevPeriod);
    }

    getHoldingPeriodsDiffVal(holding, p1, p2){
        const
            p1h = holding[p1],
            p2h = holding[p2],
            p1u = p1h ? p1h[this.COL_MAPPING.units] : 0,
            p2u = p2h ? p2h[this.COL_MAPPING.units] : 0,
            diffUnits = p1u - p2u,
            price = (p1h || p2h || {})[this.COL_MAPPING.priceUsd] || 0,
            calcedValueDiff = (p1u - p2u) * price / 100.0,
            absCalcedValueDiff = Math.abs(calcedValueDiff),
            isSignificantDiff =  (
                (absCalcedValueDiff > this.VALUE_DIFF_MIN_THRESHOLD_USD) &&
                (
                    (absCalcedValueDiff > this.VALUE_DIFF_MEANINGFUL_THRESHOLD_USD) ||
                    (Math.abs(diffUnits) > (Math.max(p1u, p2u)) * this.VALUE_DIFF_MEANINGFUL_THRESHOLD_RATE)
                )),

            res = isSignificantDiff ? calcedValueDiff : 0;

        // console.log("res", res, holding)
        // if (/aram/i.test(holding[this.COL_MAPPING.inst])){
        //     debugger
        // }

        return res;

    }

    getHoldingPeriodVal(holding, periodFld){
        const v = holding[periodFld];
        return v ?
            v[this.COL_MAPPING.units] * v[this.COL_MAPPING.priceUsd] / 100.0
            : 0;
    }

    isPeriodFld(fld){
        return !!(this.allPeriodsInverted[fld]);
    }

    buildSecWithIsin(secName, isin){
        return `${secName} (${isin})`;
    }

    getAllRawData() {return this.allRawData;}
    getRawData() {return this.rawData;}
    getRawDataProcessingErrors() {return this.rawDataProcessingErrors;}
    getRawDataSums() {return this.rawDataSums;}

    exist({institution, security, category, issuer, managingCompany} = {}){
        return !!(
            (institution && this.byInstName[institution]) ||
            (security && (this.bySecurityName[security] || this.bySecurityNameIsin[security])) ||
            (category && this.perCategory[category]) ||
            (issuer && this.byIssuer[issuer]) ||
            (managingCompany && this.byManagingCompany[managingCompany])
        )
    }

    getMarketTrendSums(){
        return this.getTrendSums();
    }

    getTrendSums({institution, security, category, issuer, managingCompany} = {}){
        const holdingsAll =(
                (institution && this.byInstName[institution]) ||
                (security && (this.bySecurityName[security] || this.bySecurityNameIsin[security] || this.byIsin[security])) ||
                (category && this.perCategory[category]) ||
                (managingCompany && this.byManagingCompany[managingCompany]) ||
                (issuer && this.byIssuer[issuer])
            ) || this.rawData,
            holdings = holdingsAll.filter(h=>this._av(h) > 0.1 || this._cv(h) > 0.1);

        const
            activePeriodHoldings = _.sumBy(holdings, this._av),
            compareToPeriodHoldings = _.sumBy(holdings, this._cv),
            diffHoldings = _.sumBy(holdings, this._acvDiff),
            totalInstitutions = _.size(_.countBy(holdings, this.COL_MAPPING.inst)),
            totalSecurities = _.size(_.countBy(holdings, this.COL_MAPPING.isin))
        ;

        return {
            activePeriodHoldings,
            compareToPeriodHoldings,
            diffHoldings,
            totalInstitutions,
            totalSecurities,
        }
    }


    // getAllBySecurityName() {return this.bySecurityName;}
    getSecHoldersChartData(secName, issuerName){
        let secDataRaw = this._loadSecDataRaw(secName, issuerName);

        const
            secHoldersChartData = this._buildHoldingsChartData(
                secDataRaw, this.COL_MAPPING.inst, {othersPercentile: 0.97, dropOthers: false});

        return secHoldersChartData;
    }

    _loadSecDataRaw(secName, issuerName,
                    {skipAggregate}={skipAggregate:false}) {
        let secDataRaw = secName && this.bySecurityName[secName];
        if (!secDataRaw) {
            secDataRaw = issuerName && this.byIssuer[issuerName];
            if (!secDataRaw) {
                secDataRaw = [];
            }else{
                if (!skipAggregate){
                    secDataRaw = this._aggregateHoldings(secDataRaw, COLS.inst);
                }

            }
        }
        return secDataRaw;
    }

    getSecChangesChartData(secName, issuerName){
        let secDataRaw = this._loadSecDataRaw(secName, issuerName, {skipAggregate:true});

        const
            groupByField = this.COL_MAPPING.inst,
            secHolderBought = this._aggregateAndCalcChanges(secDataRaw, groupByField).diffMap;
            // {aggregated, diffMap} = this._aggregateAndCalcChanges(secDataRaw, groupByField),
            // [secData, secHolderBought ]= [aggregated, diffMap];


        let secChangesChartData = this._diffMapToChartData(secHolderBought);
        secChangesChartData = this._sortAndGetUpperPercentile(
            secChangesChartData, {upperPercentile: 0.95, addOthers: true});

        return {secChangesChartData, secHolderBought};
    }

    getSecurityRawData(secName, issuerName){
        let secDataRaw = this._loadSecDataRaw(secName, issuerName);

        return secDataRaw.map(holding=>{
            return {
                [this.COL_MAPPING.inst]: holding[this.COL_MAPPING.inst],
                activePeriodHolding: this._av(holding),
                compareToPeriodHolding: this._cv(holding),
                [SBConsts.DEFAULT_COL_NAMES.DIFF]: this._acvDiff(holding)
            }
        }).filter(curr=>((curr.activePeriodHolding > 0) || (curr.compareToPeriodHolding > 0)) )
    }

    getAllSecurities(){
        return this._getAll(this.bySecurityName, {additionalFlds: [COLS.secName, COLS.isin]});
    }

    getIssuerSecurites(issuer){
        const secs =
            this._aggregateHoldings(
                this.byIssuer[issuer],
                this.COL_MAPPING.secNameIsin
            ).map(holding => {
                return {
                    [this.COL_MAPPING.secNameIsin]: holding[this.COL_MAPPING.secNameIsin],
                    activePeriodHolding: this._av(holding),
                    compareToPeriodHolding: this._cv(holding),
                };
            }).filter(row=>row.activePeriodHolding > 0.1 || row.compareToPeriodHolding > 0.1);

        return secs

    }

    getSecMetadataByName(secNameOrIsin){
        const holdings =
            this.bySecurityName[secNameOrIsin] ||
            this.bySecurityNameIsin[secNameOrIsin] ||
            this.byIsin[secNameOrIsin]
        ;

        if (_.some(holdings)) {
            return _.pick(holdings[0],
                [
                    COLS.secName, COLS.secNameIsin, COLS.isin, COLS.category,
                    COLS.assetClass, COLS.currency
                ]);
        }else{
            console.log(`WARN - '${secNameOrIsin}' not found`)
            return null;
        }
    }

    getFundChangesChartData(topBottomCount = 5){
        const
            fundChangesChartData = _
                .chain(this.bySecurityName)
                .map((holders, securityName)=> {
                    const diff = _.sumBy(holders, this._acvDiff);
                    return {
                        name: securityName,
                        y: Math.round(diff),
                        drilldown: securityName,
                        color: this.colorFunc(diff)
                    };
                })
                .sortBy(e => -e.y)
                .valueOf(),
            len = fundChangesChartData.length,
            fundChangesTopBottomChartData = fundChangesChartData
                .slice(0, 5)
                .concat(fundChangesChartData.slice(len - 5, len)),
            secNames = _.map(fundChangesChartData, 'name'),
            fundChangesDrilldownsSeries = _.map(secNames, currSecName=> {
                const
                    forChart = this.bySecurityName[currSecName]
                        .map(holder => {
                            const diff = this._acvDiff(holder);
                            return {
                                name: holder[this.COL_MAPPING.inst],
                                y: Math.round(diff),
                                color: this.colorFunc(diff)
                            }
                        })
                        .filter(e=>Math.abs(e.y) > this.CHANGE_DISPLAY_MIN_USD),
                    data = _.sortBy(forChart,e=>-e.y);
                return {
                    id: currSecName,
                    name: currSecName,
                    data
                };
            });

        return {fundChangesTopBottomChartData, fundChangesDrilldownsSeries};
    }

    getPreferredCategoriesData(){
        let
            holdingsPerCategorySeries = [],
            holdingsPerCategoryDrilldownSeries = [],
            changesPerCategorySeries = [];


        _.forEach(this.perCategory, (holders, category)=>{
            const resTotals =
                holders.reduce((acc, holder) => {
                    const
                        currHolding = this._av(holder),
                        diff = this._acvDiff(holder);

                    acc.totalHoldings += currHolding;
                    acc.totalDiffs += diff;
                    return acc;

                }, {
                    totalHoldings: 0,
                    totalDiffs: 0,
                });
            holdingsPerCategorySeries.push({
                name: category,
                drilldown: category,
                y: Math.round(resTotals.totalHoldings)
            });
            changesPerCategorySeries.push({
                name: category,
                y: Math.round(resTotals.totalDiffs),
                color: this.colorFunc(resTotals.totalDiffs)
            });

            // drill down
            const perInst = _.groupBy(holders, this.COL_MAPPING.inst);
            let sumPerInst = _
                .chain(perInst)
                .map((holdings, inst)=> {
                    return {
                        name: inst,
                        y: Math.round(_.sumBy(holdings, this._av))
                    };
                })
                .sortBy(e=>-e.y)
                .valueOf();
            sumPerInst = this._sortAndGetUpperPercentile(sumPerInst)

            holdingsPerCategoryDrilldownSeries.push({
                id: category,
                name: category,
                data: sumPerInst
            })
        });

        holdingsPerCategorySeries = this._sortAndGetUpperPercentile(holdingsPerCategorySeries);
        // holdingsPerCategoryDrillDownsSeries = []
        changesPerCategorySeries = this._sortAndGetUpperPercentile(changesPerCategorySeries, {addOthers: false})

        // topBottomChangesPerCategorySeries: seems useless, no cat went down
        // const
        //     len = changesPerCategorySeries.length,
        //     topBottomChangesPerCategorySeries = changesPerCategorySeries
        //         .slice(0, 5)
        //         .concat(changesPerCategorySeries.slice(len - 5, len));

        return {holdingsPerCategorySeries, changesPerCategorySeries, holdingsPerCategoryDrilldownSeries};
    }

     getCatByInstsChartsData(catName){
        let catDataRaw = this.perCategory[catName];
        if (!catDataRaw){
            return null;
        }

        const
            groupByField = this.COL_MAPPING.inst,
            {aggregated, diffMap} = this._aggregateAndCalcChanges(catDataRaw, groupByField),
            [catData, catHolderBought] = [aggregated, diffMap];

        let catInstChangesSumChart = this._diffMapToChartData(catHolderBought);
        catInstChangesSumChart = this._sortAndGetUpperPercentile(
            catInstChangesSumChart, {upperPercentile: 0.9, addOthers: true});

         const
            catHoldersChartData = this._buildHoldingsChartData(
                catData, groupByField,
                {othersPercentile: 0.95, calcOthersUsingMaxDiff: false});

        return {catHolderBought, catHoldersChartData, catInstChangesSumChart};
    }

    getCatByFundsChartsData(catName){

        let catDataRaw = this.perCategory[catName];
        if (!catDataRaw){
            return null;
        }


        const
            groupByField = this.COL_MAPPING.secNameIsin,
            catSecChanges = this._aggregateAndCalcChanges(catDataRaw, groupByField).diffMap;
            // {aggregated, diffMap} = this._aggregateAndCalcChanges(catDataRaw, groupByField),
            // [catData, catSecChanges] = [aggregated, diffMap];


        let catSecChangesSumChart = this._diffMapToChartData(catSecChanges);
        catSecChangesSumChart = this._sortAndGetUpperPercentile(
            catSecChangesSumChart, {upperPercentile: 0.9, addOthers: true});

        return {catSecChanges, catSecChangesSumChart};
    }

    getAllCategories(){
        return this._getAll(this.perCategory);
    }

    getAllIssuers(){
        return this._getAll(this.byIssuer);
    }

    getCatByInstPivotRawData(catName){

        const perSec = _.groupBy(this.perCategory[catName], this.COL_MAPPING.secNameIsin);
        return this._getDiffPivotRawData(
            this.COL_MAPPING.secNameIsin, this.COL_MAPPING.inst, perSec,
            {additionalMasterFields: [this.COL_MAPPING.secName], useDiff: false})
    }

    getCatInstDiffRawData(catName){
        const
            baseFields = [
                this.COL_MAPPING.inst,
                this.COL_MAPPING.secName,
                this.COL_MAPPING.secNameIsin,
                this.COL_MAPPING.isin,
            ],
            fields = baseFields.concat([this.activePeriod, this.compareToPeriod, SBConsts.DEFAULT_COL_NAMES.DIFF])
        const data = (this.perCategory[catName] || []).map(holding=>{
            const res = baseFields.reduce((h, fld)=> {
                h[fld] = holding[fld];
                return h;
            }, {});

            res[this.activePeriod] = this._av(holding);
            res[this.compareToPeriod] = this._cv(holding);
            res[SBConsts.DEFAULT_COL_NAMES.DIFF] = this._acvDiff(holding);

            return res;
        }).filter(dataRecord=>dataRecord[SBConsts.DEFAULT_COL_NAMES.DIFF] !== 0);

        return {data, fields};
    }

    getAllInstitutions(){
        return this._getAll(this.byInstName);
    }

    getAllManagingCompanies(){
        return this._getAll(this.byManagingCompany,
            {
                enrichOrFilterCB: ({res, holdings, key: managingCompany})=>{
                    const
                        insts = _.uniq(holdings.map(h=>h[COLS.inst])),
                        instsCount = insts.length;

                    if (instsCount === 1 && insts[0] === managingCompany){
                        // manage itself alone, not interesting
                        return null;
                    }
                    res.instsCount = instsCount;
                    return res;
                }
            });
    }

    getManagingCompanyInsts(managingCompany){
        const secs =
            this._aggregateHoldings(
                this.byManagingCompany[managingCompany],
                this.COL_MAPPING.inst,
            ).map(holding => {
                return {
                    [COLS.inst]: holding[COLS.inst],
                    activePeriodHolding: this._av(holding),
                    compareToPeriodHolding: this._cv(holding),
                    [SBConsts.DEFAULT_COL_NAMES.DIFF]: this._acvDiff(holding)
                };
            }).filter(row=>row.activePeriodHolding > 0.1 || row.compareToPeriodHolding > 0.1);

        return secs

    }

    getInstitutionsRawData(instName, managingCompany){
        let instDataRaw = this.byInstName[instName];
        if (!instDataRaw){
            instDataRaw = this.byManagingCompany[managingCompany];
            if (!instDataRaw){
                return null;
            }
        }

        return instDataRaw.map(holding=>{
            const
                activePeriodHolding = this._av(holding),
                compareToPeriodHolding = this._cv(holding),
                activePeriodDiff = this._acvDiff(holding);

            return {
                secNameIsin: holding[COLS.secNameIsin],
                category: holding[COLS.category],
                activePeriodHolding,
                compareToPeriodHolding,
                activePeriodDiff,
            }
        })
    }

    getInstByCatDiffPivotRawData(){
        return this._getDiffPivotRawData(
            COLS.category, COLS.inst, this.perCategory)
    }

    getInstCategoriesChartsData(instName, managingCompany){
        let instDataRaw = this.byInstName[instName];
        if (!instDataRaw){
            instDataRaw = this.byManagingCompany[managingCompany];
            if (!instDataRaw){
                return null;
            }
        }

        // aggregate same category holdings

        const
            groupByField = COLS.category,
            {aggregated, diffMap, drilldownSeries} = this._aggregateAndCalcChanges(instDataRaw, groupByField,
                {
                    drilldownByField: groupByField, drilldownByDiff: true, drilldownTitleFld: this.COL_MAPPING.secNameIsin
                }),
            [instData, instCategoriesBought] = [aggregated, diffMap];

        let instCategoriesChangesSumChart = this._diffMapToChartData(instCategoriesBought);
        instCategoriesChangesSumChart = this._sortAndGetUpperPercentile(
            instCategoriesChangesSumChart, {upperPercentile: 0.9, addOthers: false});

        const
            instCategoriesChartData = this._buildHoldingsChartData(
                instData, groupByField,
                {othersPercentile: 0.95, calcOthersUsingMaxDiff: false});

        const instCategoriesChangesSecDrilldownSeries = drilldownSeries;
        instCategoriesChangesSumChart.forEach(catChange=>catChange.drilldown = catChange.name);
        //

        const res = {
            instCategoriesChangesSecDrilldownSeries,
            instCategoriesChangesSumChart,
            instCategoriesChartData,
            instCategoriesBought};
        // console.log("getInstCategoriesChartsData", res);
        return res;
    }


    _findUpperPercentileIndex(series, total, upperPercentile){
        let upperPercentileSum = 0, upperPercentileIndex = 0;
        _.forEach(series, (e,i)=>{
            upperPercentileSum += Math.abs(e.y);
            if (upperPercentileSum > upperPercentile * total){
                upperPercentileIndex = i + 1;
                return false;
            }
        })

        return upperPercentileIndex;
    }

    _sortAndGetUpperPercentile(series, {upperPercentile = 0.8, addOthers = true} = {}){
        let [plus, minus] = _.partition(series, e=>e.y >= 0);
        minus = _.sortBy(minus, 'y');
        plus = _.sortBy(plus, 'y').reverse();
        const totalMinus = -1 * _.sumBy(minus, 'y'),
            totalPlus = _.sumBy(plus, 'y')

        const
            minusUpperPercentileIndex = this._findUpperPercentileIndex(minus, totalMinus, upperPercentile),
            minusUpperPercentile = _.slice(minus, 0, minusUpperPercentileIndex).reverse(),
            minusOthers = _.slice(minus, minusUpperPercentileIndex),

            plusUpperPercentileIndex = this._findUpperPercentileIndex(plus, totalPlus, upperPercentile),
            plusUpperPercentile = _.slice(plus, 0, plusUpperPercentileIndex),
            plusOthers = _.slice(plus, plusUpperPercentileIndex),

            allOthers = minusOthers.concat(plusOthers);

        if (addOthers){
            if (allOthers.length === 1){
                // no point in others, use as is
                return [...plus, ...minus];
            }
            const
                sumY = _.sumBy(allOthers, 'y'),
                others = {
                    name: 'Others',
                    y: sumY,
                    color: this.colorFunc(sumY)
                };

            if (sumY > 0){
                return [...plusUpperPercentile, others, ...minusUpperPercentile];
            }
        }
        // reaching here means we opt out for others or it was zero
        return [...plusUpperPercentile, ...minusUpperPercentile];

    }

    _aggregateHoldings(holdings, groupByField){
        const
            emptyPeriod = {
                [COLS.units]: 0,
                [COLS.marketValueUsd]: 0,
                [COLS.priceUsd]: 0,
            },
            groupedBy = _.groupBy(holdings, groupByField),
            aggregatedData = _.map(groupedBy, (holdingsOfGroup, groupName) => {
                // let resRecord = _.pick(_.cloneDeep(holdingsOfGroup.shift()), [groupByField, ...sumFields]);
                let resRecord = {
                    [groupByField]: groupName,
                    [this.activePeriod]: _.clone(emptyPeriod),
                    [this.compareToPeriod]: _.clone(emptyPeriod),
                    aggregatedDiffUSD: 0,
                }
                holdingsOfGroup.forEach(holding => {
                    [this.activePeriod, this.compareToPeriod].forEach(periodFld=> {
                        [COLS.units, COLS.marketValueUsd].forEach(
                            nestedFld => {
                                const holdingVal = (holding[periodFld] && holding[periodFld][nestedFld]) || 0
                                resRecord[periodFld][nestedFld] += holdingVal;
                            });
                    });
                    resRecord.aggregatedDiffUSD += this._acvDiff(holding);
                });
                // reacalc prices, in case we need it later
                // not we're skipping us conversion for now, apparently (read: hopefully) not importent
                [this.activePeriod, this.compareToPeriod].forEach(periodFld=> {
                    const prd = resRecord[periodFld];
                    if (prd[COLS.units] > 0.1){
                        prd[COLS.priceUsd] = (prd[COLS.marketValueUsd] / prd[COLS.units]) * 100.0;
                    }
                });


                return resRecord;
            });
        return aggregatedData;
    }

    _aggregateAndCalcChanges(holdings_, groupByField,
                             {
                                 drilldownByField, drilldownByDiff, drilldownTitleFld
                             } = {}){
        let drilldownSeries = null;
        if (drilldownByField){
            // todo currently drilldown works only for same groupby like groupByField
            // todo need to optionally do another gropby with aggregation (this._aggregateHoldings ?)
            const
                byDrilldown = _.groupBy(holdings_, drilldownByField),
                ddFunc = drilldownByDiff ? this._acvDiff :  this._av;
            drilldownSeries = _.map(byDrilldown, (holdings, groupByVal) => {
                const currDDSeries = _.chain(holdings)
                    .map(currDDHolding => {
                        const y = ddFunc(currDDHolding);
                        return {
                            name: currDDHolding[drilldownTitleFld],
                            y: Math.round(y),
                            color: this.colorFunc(y),
                    };
                    })
                    .filter(e=>Math.abs(e.y) > 0.1)
                    .sortBy(e => -e.y)
                    .valueOf(),

                ddRes = {
                    id: groupByVal,
                    name: groupByVal,
                    data: currDDSeries
                };

                return ddRes;
            });
        }

        let holdings = this._aggregateHoldings(holdings_, groupByField);
        holdings = _.sortBy(holdings, h=>-this._av(h));

        let diffMap = {};
        holdings.forEach(holding=>{
            const
                groupByVal = holding[groupByField],
                diff = this._acvDiff(holding);

            if (Math.abs(diff) > 1){
                diffMap[groupByVal] = diff;
            }
        });

        const res = {aggregated: holdings, diffMap};
        if (drilldownSeries){
            res.drilldownSeries = drilldownSeries;
        }
        return res;
    }

    _diffMapToChartData(diffMap, {trendColors = true} = {}){
        const chartData = _.map(diffMap, (diff, name)=>{
            const nodeData = {
                name,
                y: Math.round(diff)
            }
            if (trendColors){
                nodeData.color = this.colorFunc(diff);
            }
            return nodeData;
        });

        return chartData;
    }


    _buildHoldingsChartData(aggregatedHoldings, groupByField,
                            {othersPercentile = 1, dropOthers = false, calcOthersUsingMaxDiff = true} = {}){
        let chartData = [];

        const
            others = {name: 'others',y: 0},
            totalHoldings = _.sumBy(aggregatedHoldings, this._av),
            othersThreshold = totalHoldings * (1 - othersPercentile);

        aggregatedHoldings.forEach(holding=>{
            const
                groupByVal = holding[groupByField],
                activeVal = Math.round(this._av(holding));

            // holdings
            if ((activeVal === 0) || (activeVal < othersThreshold)){
                others.y += activeVal;
            }else{
                chartData.push({name: groupByVal, y: activeVal,});
            }
        });
        chartData = _.sortBy(chartData, e=>-e.y);

        if (!dropOthers){
            if (others.y !== 0){
                chartData.push(others);
            }
        }


        return chartData;
    }

    _getDiffPivotRawData(masterField, pivotField, byMasterFieldData,
                         {additionalMasterFields = [], useDiff = true} = {}){
        const
            totalHdr = SBConsts.DEFAULT_COL_NAMES.TOTAL,
            getVal = useDiff ? this._acvDiff : this._av;
        let resPivotTableData = [],
            allPivotFieldVals = _(byMasterFieldData)
                .map((pivotFldHoldings,masterFldVal)=>pivotFldHoldings.map(holding=>holding[pivotField]))
                .flatten()
                .uniq()
                .valueOf(),
            // allPivotFieldVals = _.keys(_.countBy(this.rawData, pivotField)),
            newRecord = allPivotFieldVals.reduce((h, inst) => {
                h[inst] = 0;
                return h;
            },{}),
            totalPerPivotVal = _.merge(_.clone(newRecord), {[totalHdr]: 0});
        _.forEach(byMasterFieldData, (masterFieldHoldings, masterFieldVal)=>{
            const byPivotField = _.groupBy(masterFieldHoldings, pivotField);
            const currRecord = _.clone(newRecord);
            currRecord[masterField] = masterFieldVal;
            _.forEach(byPivotField, (pivotedHoldings, pivotFieldVal)=>{
                currRecord[pivotFieldVal] = _.sumBy(pivotedHoldings,getVal);
                totalPerPivotVal[pivotFieldVal] += currRecord[pivotFieldVal];
                if (_.some(pivotedHoldings)){
                    additionalMasterFields.forEach(fld=>currRecord[fld] = pivotedHoldings[0][fld])
                }
            });
            currRecord[totalHdr] = _
                .chain(currRecord)
                .values()
                .filter(v=>!_.isString(v))
                .sum()
                .value();

            if (Math.abs(currRecord[totalHdr]) > 0.1 &&
                (masterFieldVal && masterFieldVal.trim && masterFieldVal.trim() !== '')){
                resPivotTableData.push(currRecord);
                totalPerPivotVal[totalHdr] += currRecord[totalHdr];
            }
        });

        allPivotFieldVals = _.sortBy(allPivotFieldVals, e=>-totalPerPivotVal[e]);
        resPivotTableData = _.sortBy(resPivotTableData, e=>-e[totalHdr]);

        return {
            columns: [masterField, ...allPivotFieldVals, totalHdr],
            data: resPivotTableData,
            totalPerPivotVal};
    }

    _getAll(holdingsMap, {additionalFlds, enrichOrFilterCB} = {}){
        const res = _
            .map(holdingsMap, (holdings, key) => {
                if (_.isEmpty(holdings) || _.isEmpty(key) || (key && key.trim && key.trim() === '')) {
                    return null;
                }
                const
                    h = holdings[0],
                    res = {
                        key,
                        activePeriodHoldings: _.sumBy(holdings, this._av),
                        compareToPeriodHoldings: _.sumBy(holdings, this._cv),
                    };
                if (_.some(additionalFlds)){
                    additionalFlds.forEach(fld => res[fld] = h[fld])
                }
                return enrichOrFilterCB ? enrichOrFilterCB({res, holdings, key}) : res;
            })
            .filter(e =>
                !!e &&
                (
                    (e.activePeriodHoldings > this.VALUE_DIFF_MIN_THRESHOLD_USD) ||
                    (e.compareToPeriodHoldings > this.VALUE_DIFF_MIN_THRESHOLD_USD)
                )
            )//compact;

        return _.sortBy(res, e => -e.activePeriodHoldings);

    }

}

let foreignHoldings = new ForeignHoldings();
window.foreignHoldings = foreignHoldings;
export {foreignHoldings, ForeignHoldingsDataType};

