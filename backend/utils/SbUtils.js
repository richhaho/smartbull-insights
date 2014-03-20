let util = require('util');
let moment = require('moment-timezone');
let Q = require("q");
let _ = require('lodash');
let querystring = require('querystring')

String.prototype.replaceAt = function (index, character) {
    return this.substr(0, index) + character + this.substr(index + character.length);
}


const Consts = require(global.__base + "/backend/utils/consts.js");
const config = require(global.__base + "/backend/config.js");

const
    _isDevelopment = (!!!process.env.NODE_ENV || (process.env.NODE_ENV === 'development')),
    _isProduction = (process.env.NODE_ENV && (process.env.NODE_ENV === 'production')),
    _isStaging = (process.env.NODE_ENV && (process.env.NODE_ENV === 'staging'));

let _isDebugLog = (process.env.DEBUG_LOG && (process.env.DEBUG_LOG === '1'));

console.log('_isDevelopment', _isDevelopment, '_isProduction', _isProduction, '_isDebugLog', _isDebugLog);

class SbUtils {
    static isDevelopment() {
        return _isDevelopment;
    }

    static isProdOrStaging(config_env, options) {
        return _isProduction || _isStaging;
    }

    static isProduction() {
        return _isProduction;
    }

    static isDebugLog() {
        return _isDebugLog;
    }

    static isFeatureFlagOn(feature, isAdmin){ return isAdmin || config.FEATURE_FLAGS.has(feature); }
    // static isFFApprovalsOn(isAdmin) {return SbUtils.isFeatureFlagOn(Consts.FF_APPROVALS, isAdmin);}

    static isSBADM(user){
        return /^(boaz|liron|rona)@smartbull\.co\.il$/.test(user.username);
    }

    /*
     * promiseSerial resolves Promises sequentially.
     * @example
     * const urls = ['/url1', '/url2', '/url3']
     * const funcs = urls.map(url => () => $.ajax(url))
     *
     * promiseSerial(funcs)
     *   .then(console.log)
     *   .catch(console.error)
     */
    static promiseSerial(funcs){
        return funcs.reduce((promise, func) =>
                promise.then(result => func().then(Array.prototype.concat.bind(result))),
            Q.resolve([]));
    }

    static groupByUnique(arr, property) {
        let res = {};
        _.forEach(arr, function (e) {
            res[e[property] = e];
        })
        return res;
    }

    static createErrorInRouteFunc(routerName){
        let _errorInRoute = (req, res, err, opts) => {
            opts = opts || {}
            const route = req.method + ' ' + req.url;
            let errorMsg = routerName + ": error in " + route + ' ';
            res.status(opts.httpErrorCode || 500).json({ok: false, error: errorMsg + err});
            console.log(errorMsg, err, err.stack || '');
        }

        return _errorInRoute;
    }

    /**
     * Hack to work around "TypeError: Converting circular structure to JSON"
     * which is seen when using JSON.stringify
     * Intended to inspection/debugging purposes.
     * Note: Will not display an Array in square brackets.
     * Shows extra trailing comma before closing brace.
     * @param obj
     * @param [onlyProps] - Show only property names
     * @param {String[]} [skipTypes=['function']] - array of types to trace only the type instead of value.
     * @return {String}
     */
    static shallowStringify(obj, onlyProps, skipTypes) {
        let objType = typeof(obj);
        if (['function', 'undefined'].indexOf(objType) >= 0) {
            return objType;
        }
        else if (['string', 'number', 'boolean'].indexOf(objType) >= 0) {
            return obj; // will toString
        }
        // objType == 'object'
        let res = '{';
        for (let p in obj) { // property in object
            if (typeof(onlyProps) !== 'undefined' && onlyProps) {
                // Only show property names as values may show too much noise.
                // After this you can trace more specific properties to debug
                res += p + ', ';
            }
            else {
                let valType = typeof(obj[p]);
                if (typeof(skipTypes) == 'undefined') {
                    skipTypes = ['function'];
                }
                if (skipTypes.indexOf(valType) >= 0) {
                    res += p + ': ' + valType + ', ';
                }
                else {
                    res += p + ': ' + obj[p] + ', ';
                }
            }
        }
        res += '}';
        return res;
    }

    // revived implementation from underscore.string (was non-intentionally replaced by lodash v4 SbUtils.toNumber
    static toNumber(num, precision) {
        if (num == null) return 0;
        let factor = Math.pow(10, isFinite(precision) ? precision : 0);
        return Math.round(num * factor) / factor;
    }

    // determine to which email the worker is about to send to
    static determineActualEmailToSend(realContactEmail, overrideEmail){
        let resEmail;
        if (overrideEmail){
            resEmail= overrideEmail;
        } else {
            let override_to = process.env.OVERRIDE_MAIL_TO;
            if (SbUtils.isProduction()) {
                if ((override_to || '') === 'sendout') {
                    override_to = realContactEmail;
                }
            } else {
                if (/(lironh|boazadato|rona123)@gmail\.com/.test(realContactEmail)) {
                    override_to = realContactEmail;
                }else if (/.*@(test\.mandrillapp\.com|smartbull\.co\.il)$/.test(realContactEmail)) {
                    override_to = realContactEmail;
                }
            }
            resEmail = overrideEmail || override_to || "liron@smartbull.co.il";
        }
        console.log(util.format('determineActualEmailToSend - realContactEmail %s overrideEmail %s resEmail %s', realContactEmail, overrideEmail, resEmail));
        return resEmail;
    }

    static arrayEmptyOfStrings(arr) {
        return _.every(arr, function (e) {
            return (_.isUndefined(e) || _.isEmpty(e.trim()));
        });
    }

    static addCommas(val, fallback) {
        if (fallback === 0) fallback = "0";// fml2

        const newVal = val || fallback || '-1';
        const splitDot = newVal.toString().split('.'),
            mantissa = splitDot.length > 1 ? splitDot[1] : null;
        let res = (splitDot[0]).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        if (res === "-1") {
            res = "-"; //fml
        } else if (mantissa ){
            res += '.' + mantissa;
        }
        return res;
    }

    static floatsEqual(f1, f2) {
        let diff = Math.abs(f2 - f1);
        return diff < 0.00001;
    }

    static toNum(str) {
        return +(str.toString().replace(/[^\d.]/g, ''))
    }

    static normalize(f, normFactor) {
        let mod = f % normFactor;
        return f - mod;
    }

    static toQueryString(obj) {
        return _.map(obj, function (v, k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(v);
        }).join('&');
    }

    static buildSrcUrl(req, excludingArray, addParams) {
        let srcUrl = req.url.split('?')[0];
        if (!_.isEmpty(req.query)) {
            let queryClone = _.clone(req.query);
            if (excludingArray) {
                if (_.isString(excludingArray)) excludingArray = [excludingArray];
                _.forEach(excludingArray, function (e) {
                    delete queryClone[e];
                })
            }
            if (addParams){
                _.merge(queryClone, addParams)
            }
            srcUrl += "?" + querystring.stringify(queryClone);
        }
        return encodeURIComponent(srcUrl);

    }

    static arrayify(val) {
        if (_.isUndefined(val)) return [];
        return ((_.isArray(val)) ? val : [val]);
    }

    static removeQuotationMarks(string){
        return string.replace(/[."״'`]/g,'');
    }

    static buildDataExportFn(auction, ...suffixes){
        let data_export_fn =
            SbUtils.removeQuotationMarks(SbUtils.getFullAuctionName(auction))+' ' +
            moment(auction.close_t).locale('he').format('DD MMMM YYYY');

        suffixes = SbUtils.arrayify(suffixes).filter(e=>(_.isString(e) && !_.isEmpty(e)));
        return [data_export_fn].concat(suffixes).join(' | ')
    }

    static quotationMarkNormalize (string){
        return string.replace('"','״').replace("''","״");
    }


}
;


module.exports = SbUtils;
