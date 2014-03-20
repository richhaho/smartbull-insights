
import _ from 'lodash'

class GovHoldings{
    constructor(){
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

    async init(rawData){
        this.rawData = rawData;
    }

    clear(){
        this.rawData = null;
    }


    getRawData() {return this.rawData;}

    getOverviewChartData(){
        const sectionFields = [
            this.COL_MAPPING.gemel,
            this.COL_MAPPING.pension,
            this.COL_MAPPING.insurance
        ];

        return {
            categories: _.map(this.rawData, this.COL_MAPPING.month),
            series: sectionFields.map(fld=>{
                return {
                    name: fld,
                    data: this.rawData.map(currMonthTotals=>currMonthTotals[fld])
                };
            })
        };
    }
}

let govHoldings = new GovHoldings();
export {govHoldings};
