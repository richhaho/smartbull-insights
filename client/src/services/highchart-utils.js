import Highcharts from 'highcharts';
import drilldown from 'highcharts/modules/drilldown';
import HighchartsExporting from 'highcharts-exporting';
import ReactHighcharts from 'react-highcharts';

import numeral from 'numeral';
import {merge} from 'lodash'
import {SBUtils} from 'services/sb-utils'

drilldown(Highcharts);
HighchartsExporting(Highcharts);


const COLORS = {
    TREND_UP: 'green',
    TREND_UP2: 'lightgreen',
    TREND_DOWN: '#BF0B23',
    TREND_DOWN2: '#BF0800'
}


Highcharts.setOptions({
    // Radialize the colors
    colors: Highcharts.map(Highcharts.getOptions().colors, function (color) {
        return {
            radialGradient: {
                cx: 0.5,
                cy: 0.3,
                r: 0.7
            },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
            ]
        };
    }),

    // font
    chart: {
        style: {
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
        }
    },

    // series border radius
    plotOptions: {
        series: {
            borderRadius: 3
        }
    },
});

// highchart specific
class HighchartUtils{
    static pieChartDefaultLabelFormatter() {
        const resFormatted =

            SBUtils.shortNumberRenderer(this.y) +
            ' / <b>' + numeral(this.percentage + '%').format('0.00%') + '</b>' +
            '<br/> ' +
            (this.key || this.name);
        // console.log("resFormatted", resFormatted)
        return resFormatted;
    }

    static pieChartDefaultLabelFormatter2() {
        const resFormatted =
            (this.key || this.name) +
            ' ' +
            SBUtils.shortNumberRenderer(this.y) +
            ' ' + numeral(this.percentage + '%').format('0.00%');
        // console.log("resFormatted", this, resFormatted)
        return resFormatted;
    }


    static pieChartPercentageLabelFormatter() {
        return numeral(this.percentage + '%').format('0.00%');
    }


    static COLORS(){
        return COLORS;
    }

    static getTrendColor(value){
        if (value === undefined || value === null || Math.abs(value) < 0.1 ){
            return 'black';
        }
        return (value > 0 ? COLORS.TREND_UP : COLORS.TREND_DOWN)
    }

    static createPieChartConfig(config = {}){
        return merge({

            credits: {enabled: false},
            chart: {
                type: 'pie'
            },
            title: {text: null},
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        formatter: HighchartUtils.pieChartPercentageLabelFormatter,
                        distance: -30,
                    },
                    showInLegend: true
                }
            },
            legend: {
                align: 'right',
                verticalAlign: 'middle',
                layout: 'vertical',
                // y: 20,
                // labelFormatter: HighchartUtils.pieChartDefaultLabelFormatter2
            },
            tooltip: {
                formatter: HighchartUtils.pieChartDefaultLabelFormatter
            },
        }, config);
    }
}

export {ReactHighcharts, HighchartUtils, Highcharts};
