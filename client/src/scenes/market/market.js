import numeral from 'numeral';
import {compact} from 'lodash'

import React, { Component } from 'react';
import {
    // Route,
    Link,
    Redirect
} from "react-router-dom";

import {Helmet} from 'react-helmet'
import DataGrid from '@zippytech/react-datagrid-pro'

import Row from 'react-bootstrap/lib/Row'
import Col from 'react-bootstrap/lib/Col'
import Panel from 'react-bootstrap/lib/Panel'

import './market.css'

import {ReactHighcharts, Highcharts, HighchartUtils} from 'services/highchart-utils'

import {foreignHoldings} from "models/foreign_holdings";
import {govHoldings} from "models/gov_holdings";
import {SBUtils} from "services/sb-utils";
import {SBConsts} from "services/sb-consts";

// import {InstTypeSelector} from 'components/inst-type-select/inst-type-select'
import {ScoreCardsPanel} from "components/scorecard/scorecards-panel";

class Market extends Component {
    state = {marketData: {}}

    async componentWillMount(){
        this.loadMarketData();
    }

    loadMarketData(){
        const
            govHoldingsChartData = govHoldings.getOverviewChartData(),
            {fundChangesTopBottomChartData, fundChangesDrilldownsSeries} = foreignHoldings.getFundChangesChartData(),
            {
                holdingsPerCategorySeries, changesPerCategorySeries, holdingsPerCategoryDrilldownSeries
            } = foreignHoldings.getPreferredCategoriesData(),
            dtInstCatPivot = foreignHoldings.getInstByCatDiffPivotRawData(),


            fundChangesChartConfig = this.getFundChangesChartConfig(fundChangesTopBottomChartData, fundChangesDrilldownsSeries),
            changesPerCategoryConfig = this.getPreferredCategoriesChangesChartConfig(changesPerCategorySeries),
            preferredCategoriesChartConfig = this.getPreferredCategoriesChartConfig(holdingsPerCategorySeries, holdingsPerCategoryDrilldownSeries),
            catInstPivot = this.getCatInstPivot(dtInstCatPivot),
            officialHoldingsChartConfig = this.getOfficialHoldingsChartConfig(govHoldingsChartData),

            // for state
            marketData = {
                officialHoldingsChartConfig,
                fundChangesChartConfig,
                changesPerCategoryConfig,
                preferredCategoriesChartConfig,
                catInstPivot
            };
        this.setState({marketData});
    }

    componentWillReceiveProps(nextProps) {
        if (
            (this.props.secType !== nextProps.secType) ||
            (this.props.period !== nextProps.period)
        ){
            this.loadMarketData();
        }
    }


    componentDidMount(){
        let reactParentComponent = this;// :(
        let chart = this.refs.changesPerCategoryChart && this.refs.changesPerCategoryChart.getChart();
        if (chart){
            chart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
            {
                label.onclick = function(){
                    setTimeout(()=>reactParentComponent.props.history.push(`/category/${this.textContent}`), 1);
                }
            });
        }
    }

    getFundChangesChartConfig(fundChangesTopBottomChartData, fundChangesDrilldownsSeries){
        let reactParentComponent = this; // :(
        return fundChangesTopBottomChartData &&
            {
                credits: {enabled: false},
                chart: {
                    type: 'bar',
                    events: {
                        drilldown: function (e) {
                            const targetHtml = e.originalEvent && e.originalEvent.target && e.originalEvent.target,
                                clickedId = e.seriesOptions && e.seriesOptions.id;

                            // clicked on label is redirect, not drill down
                            if (targetHtml && (targetHtml.nodeName === 'tspan')) {
                                e.preventDefault();
                                setTimeout(()=>reactParentComponent.props.history.push(`/security/${clickedId}`), 1);
                            } else {
                                this.setTitle(null, {
                                    text: "Zoom on " + e.point.name
                                });
                            }

                        },
                        drillup: function (e) {
                            this.setTitle(null, {text: ""});
                        }
                    }

                },
                title: {text: null},
                legend: {
                    enabled: false
                },                          
                xAxis: {
                    type: 'category',
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            formatter: function () {
                                return SBUtils.shortNumberRenderer(this.y);
                            }
                        }
                    }
                },
                tooltip: {
                    formatter: function () {
                        return this.key + '<br/>' + numeral(this.y).format('$ 0,0[.]00');
                    }
                },
                series: [{
                    name: 'Top Fund Changes',
                    data: fundChangesTopBottomChartData
                }],
                drilldown: {
                    series: fundChangesDrilldownsSeries
                }
            }

    }

    getPreferredCategoriesChangesChartConfig(changesPerCategorySeries){
        const preferredCategoriesChangesChartOpts = {
            credits: {enabled: false},
            chart: {type: 'bar',},
            title: {text: null},
            legend: {enabled: false},
            xAxis: {
                type: 'category',
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return SBUtils.shortNumber$Renderer(this.y);
                        }
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    return this.key + '<br/>' + numeral(this.y).format('$ 0,0[.]00');
                }
            },
            series: [{
                name: `${foreignHoldings.activeAndPrevPeriodsComparisonDesc} Changes`,
                data: changesPerCategorySeries
            }]
        };

        return preferredCategoriesChangesChartOpts;
    }

    getPreferredCategoriesChartConfig(holdingsPerCategorySeries, holdingsPerCategoryDrilldownSeries) {
        let reactParentComponent = this;
        return holdingsPerCategorySeries &&
            HighchartUtils.createPieChartConfig({
                chart: {
                    events: {
                        drilldown: function (e) {
                            const targetHtml = e.originalEvent && e.originalEvent.target,
                                clickedId = e.seriesOptions && e.seriesOptions.id;
                            // clicked on label is redirect, not drill down
                            if (targetHtml && (targetHtml.nodeName === 'tspan')) {
                                e.preventDefault();
                                if (clickedId) {
                                    setTimeout(() => reactParentComponent.props.history.push(`/category/${clickedId}`), 1);
                                }
                            } else {
                                this.setTitle(null, {
                                    text: "Preferred Category: " + e.point.name
                                });
                            }

                        },
                        drillup: function (e) {
                            this.setTitle(null, {text: ""});
                        }
                    }
                },
                series: [{
                    name: 'Preferred Categories',
                    data: holdingsPerCategorySeries
                }],
                drilldown: {
                    series: holdingsPerCategoryDrilldownSeries
                }
            });
    }

    getCatInstPivot(catInstPivotData){
        if (!catInstPivotData){
            return null;
        }

        const dataSource = catInstPivotData.data;
        const columns = compact(
            catInstPivotData.columns.map(col=> {
                const
                    isCatNameCol = col === foreignHoldings.COL_MAPPING.category,
                    isTotalsCol = col === SBConsts.DEFAULT_COL_NAMES.TOTAL,
                    defaultLocked = (() => {
                        if (isCatNameCol) {
                            return 'start'
                        } else if (isTotalsCol) {
                            return 'end'
                        }
                        return false
                    })();

                const colDef = {
                    name: col,
                    flex: isCatNameCol ? 3 : 1,
                    minWidth: 200,
                    defaultLocked
                };

                let omitCol = false;
                if (isCatNameCol) {
                    colDef.render = ({value}) => {
                        return <Link to={`/category/${value}`}>{value}</Link>
                    }
                } else {
                    colDef.type = 'number';
                    colDef.render = ({value}) => {
                        return <span className={SBUtils.diffToClass(value)}>
                        {SBUtils.shortNumber$Renderer(value)}
                        </span>
                    }
                    if (!isTotalsCol) {
                        let totalChangesForInst = catInstPivotData.totalPerPivotVal[col];
                        // console.log(`col ${col} totalPerPivotVal ${totalPerPivotVal}`)
                        if (Math.abs(totalChangesForInst) < 0.1) {
                            omitCol = true;
                        }else{
                            colDef.header = (cellProps) => {
                                return (
                                    <Link to={`/institution/${col}`}>
                                        {col}<br/>
                                        <span className={SBUtils.diffToClass(totalChangesForInst)}> ${SBUtils.shortNumberRenderer(totalChangesForInst)}</span>
                                    </Link>);

                            }
                        }
                    }
                }
                return omitCol ? null : colDef
            })  // map
        ); // compact

        const res = {columns, dataSource};
        // console.log("getCatInstChanges", res)
        return res;
    }

    getOfficialHoldingsChartConfig(govHoldingsChartData){
        return {
            chart: {
                type: 'column',
            },
            title: {
                text: null
            },
            legend: {
                align: 'center',
                x: 30,
                verticalAlign: 'top',
                y: 10,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                        formatter: function () {
                            return SBUtils.shortNumberRenderer(this.y);
                        }

                    },
                }
            },
            tooltip: {
                formatter: function () {
                    return this.series.name + '<br/>' +
                        '$' + numeral(this.y).format('0,0') +'<br/>' +
                        numeral(this.percentage + '%').format('0.00%')
                        ;
                }
            },
            xAxis: {
                type: 'category',
                categories: govHoldingsChartData.categories
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Total Holdings Per Institution Type'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme &&  Highcharts.theme.textColor) || 'gray'
                    },
                    formatter: function () {
                        return SBUtils.shortNumber$Renderer(this.total);
                    }
                },
                labels: {
                    enabled: false
                }

            },

            series: govHoldingsChartData.series
        };
    }

    render(){
        if (this.props.location.pathname === '/'){
            return (
                <Redirect to="/market/" />
            )
        }


        const {
            officialHoldingsChartConfig,
            fundChangesChartConfig,
            changesPerCategoryConfig,
            preferredCategoriesChartConfig,
            catInstPivot
        } = this.state.marketData;

        return (
            <div className={''}>
                <Helmet>
                    <title>{SBUtils.buildTitle('Market Trends')}</title>
                </Helmet>

                <ScoreCardsPanel trendSumsDef={undefined}/>
                <Row>
                    {fundChangesChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Fund Changes</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={fundChangesChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>

                    }
                    {preferredCategoriesChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Preferred Categories</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={preferredCategoriesChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>
                    }
                    {changesPerCategoryConfig &&
                    <Col sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Top Category Changes</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts
                                    domProps={{
                                        id: 'changes-per-category-chart',
                                        className: 'highcharts-x-axis-link-style'
                                    }}
                                    config={changesPerCategoryConfig}
                                    ref='changesPerCategoryChart'
                                />
                            </Panel.Body>
                        </Panel>
                    </Col>
                    }

                </Row>
                {catInstPivot &&
                <Row>
                    <Col sm={12}>
                    <Panel className="panel-primary">
                        <Panel.Heading>
                            <Panel.Title componentClass="h3">Institutions - Monetary Changes by Category</Panel.Title>
                        </Panel.Heading>
                        <Panel.Body>
                            <DataGrid
                                id={'cat-inst-pivot-grid'}
                                columns={catInstPivot.columns}
                                dataSource={catInstPivot.dataSource}
                                showZebraRows={false}
                            />
                        </Panel.Body>
                    </Panel>
                    </Col>
                </Row>
                }

                {officialHoldingsChartConfig &&
                <Row>
                    <Col sm={12}>
                    <Panel className="panel-primary">
                        <Panel.Heading>
                            <Panel.Title componentClass="h3">Official Holdings
                            (source: <a href="http://mof.gov.il/hon/Pension/Pages/Order-properties.aspx" target="blank">
                            Ministry of Finance <span className="glyphicon glyphicon-new-window"/></a> )</Panel.Title>
                        </Panel.Heading>
                        <Panel.Body>
                            <ReactHighcharts config={officialHoldingsChartConfig}/>
                        </Panel.Body>
                    </Panel>
                    </Col>
                </Row>
                }
            </div>
        )
    }
}


export {Market};
