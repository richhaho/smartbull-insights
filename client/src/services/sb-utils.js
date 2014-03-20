
import numeral from 'numeral';
import {SBConsts} from 'services/sb-consts'
import {compact} from 'lodash'


// sb-env is more approprate for this. atm no such thing, refactor if the need emerges
const isDev = /localhost/.test(window.location.href);
if (isDev){
    console.log("running in dev mode")
}


class SBUtils{
    static isDev(){return isDev;}

    static shortNumberRenderer(value) {
        return numeral(value).format('0[.]0a').toUpperCase();
    }

    static shortNumber$Renderer(value, zeroReplaceStr = '') {
        if (!value || value === 0){
            return zeroReplaceStr;
        };
        
        return '$' + SBUtils.shortNumberRenderer(value);
    }

    static diffToClass(diff) {
        if (diff < -1){
            return 'text-danger';
        }else if(diff > 1){
            return 'text-success';
        }
        return 'text-info';
    };

    static createDiffRowClassName = (dataFld) => {
        return ({data}) => SBUtils.diffToClass(data[dataFld]);
    }

    static buildTitle(...args){
        return compact(args.concat([SBConsts.BASE_TITLE])).join(' - ')
    }

    static calcGrowthRatio(newVal,oldVal){
        if (oldVal < 0.001){
            return 100;
        }

        return ((newVal / oldVal) - 1.0) * 100.0;
    }

    static buildFilterLabel(entity, {overrideKey} = {}){
        return `${overrideKey || entity.key} (${SBUtils.shortNumber$Renderer(entity.activePeriodHoldings, '$0')})`;
    }

}

export {SBUtils}
