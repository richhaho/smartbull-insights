import numeral from 'numeral'
import {find, compact} from 'lodash'

import React, { Component } from 'react';
import {Helmet} from 'react-helmet'
import {
    // Route,
    Link,
} from "react-router-dom";

import Row from 'react-bootstrap/lib/Row'
import Col from 'react-bootstrap/lib/Col'
import Panel from 'react-bootstrap/lib/Panel'
import Label from 'react-bootstrap/lib/Label'

import Select from 'react-select'
import DataGrid from '@zippytech/react-datagrid-pro'
import ReactExport from "react-data-export";

import {ReactHighcharts, HighchartUtils} from 'services/highchart-utils'
import {foreignHoldings} from "models/foreign_holdings";
import {SBUtils} from 'services/sb-utils'
import {SBConsts} from 'services/sb-consts'
import {ScoreCardsPanel} from "components/scorecard/scorecards-panel";

import './category.css'


const
    diffColName = SBConsts.DEFAULT_COL_NAMES.DIFF,
    totalColName = SBConsts.DEFAULT_COL_NAMES.TOTAL;

class Category extends Component {
    state = {
        selectedCategory: '',
        categoriesSelectOptions: [{label: 'loading...', disabled: true}],
        category: {},
        catInstChangesGroupBy: [foreignHoldings.COL_MAPPING.inst],
    }

    constructor(props) {
        super(props);

        this.onCategorySelected = this.onCategorySelected.bind(this);
        this.onCatInstChangesGroupByChange = this.onCatInstChangesGroupByChange.bind(this);

        this.catInstChangesRowclass = SBUtils.createDiffRowClassName(diffColName);
        this.catInstPivotRowclass = SBUtils.createDiffRowClassName(totalColName);
    }

    async componentWillMount(){
        this.setSelectors();

        await this.selectFromRoute(this.props);
    }

    async setSelectors() {
        const categoriesSelectOptions = foreignHoldings.getAllCategories().map(cat => {
            return {
                label: SBUtils.buildFilterLabel(cat),
                value: cat.key,
            }
        })
        await this.setState({categoriesSelectOptions});
    }

    async selectFromRoute(props) {
        const selectedCategory = props.match.params.catName;
        if (selectedCategory) {
            const existQ = {category: selectedCategory};
            if (foreignHoldings.exist(existQ)) {
                await this.setState({selectedCategory});
                this.loadCategory();
            } else {
                console.log('selectFromRoute warning - unknown', existQ)
            }
        }
    }

    async componentWillReceiveProps(nextProps) {
        if (
            (this.props.secType !== nextProps.secType) ||
            (this.props.periodType !== nextProps.periodType)
        ){
            await this.setSelectors();
            if (find(this.state.categoriesSelectOptions, e=>e.value === this.state.selectedCategory)){
                this.loadCategory();
            }else{
                this.setState({selectedCategory: '', category: {}});
                this.props.history.push('/category/');
            }
        } else if (this.props.period !== nextProps.period){
            this.loadCategory();
        } else if (this.props.location.pathname !== nextProps.location.pathname) {
            // route changed
            this.selectFromRoute(nextProps);
        }
    }

    async loadCategory(){
        const catName = this.state.selectedCategory;
        if (catName){
            const
                {
                    catHoldersChartData,
                    catInstChangesSumChart
                } = foreignHoldings.getCatByInstsChartsData(catName),
                {catSecChanges, catSecChangesSumChart} = foreignHoldings.getCatByFundsChartsData(catName),
                catInstDiffRawData = foreignHoldings.getCatInstDiffRawData(catName),
                catByInstPivotRawData = foreignHoldings.getCatByInstPivotRawData(catName)
            ;
            const category = {
                name: catName,
                catSecChangesChartConfig: this.getCatSecChangesChartConfig(catSecChanges, catSecChangesSumChart),
                catInstChangesSumChartConfig: this.getCatInstChangesSumChartConfig(catInstChangesSumChart),

                catHoldersChartConfig: this.getCatHoldersChartConfig(catHoldersChartData),
                catInstChanges: this.getCatInstChanges(catInstDiffRawData),
                catInstPivot: this.getCatInstPivot(catByInstPivotRawData)

            };

            this.setState({category});
        }else{
            this.setState({category: {}});
        }
    }

    async onCategorySelected(newSelectedCategory){
        const selectedCategory = newSelectedCategory ? newSelectedCategory.value : '';
        await this.setState({selectedCategory});
        this.props.history.push('/category/' + selectedCategory);
        this.loadCategory();
    }

    getCatHoldersChartConfig(catHoldersChartData){
        const
            catHoldersChartOpts = catHoldersChartData &&
                HighchartUtils.createPieChartConfig({
                    series: [{
                        name: 'holders of ' + this.state.category.name,
                        data: catHoldersChartData
                    }]
                });
        return catHoldersChartOpts;
    }

    getCatInstPivot(catInstPivotData){
        const dataSource = catInstPivotData.data;

        const columns = compact(
            catInstPivotData.columns.map(col => {
                if (catInstPivotData.totalPerPivotVal[col] < 0.1){
                    return null;
                }
                const
                    isSecNameCol = col === foreignHoldings.COL_MAPPING.secNameIsin,
                    isTotalsCol = col === totalColName,
                    defaultLocked = (() => {
                        if (isSecNameCol) {
                            return 'start'
                        } else if (isTotalsCol) {
                            return 'end'
                        }
                        return false
                    })();

                const colDef = {
                    name: col,
                    flex: isSecNameCol ? 3 : 1,
                    minWidth: isSecNameCol ? 200 : 100,
                    defaultLocked
                };
                if (isSecNameCol) {
                    colDef.render = ({value}) => {
                        return <Link to={`/security/${value}`}>{value}</Link>
                    }

                } else {
                    colDef.type = 'number';
                    colDef.render = ({value}) => {
                        return <span>{SBUtils.shortNumber$Renderer(value)}</span>
                    }
                    if (isTotalsCol) {
                        colDef.header = (cellProps) => {
                            return (
                                <div>
                                    {col}<br/>
                                    ${SBUtils.shortNumberRenderer(catInstPivotData.totalPerPivotVal[col])}
                                </div>);
                        }

                    }else{
                        colDef.header = (cellProps) => {
                            return (
                                <Link to={`/institution/${col}`}>
                                    {col}<br/>
                                    ${SBUtils.shortNumberRenderer(catInstPivotData.totalPerPivotVal[col])}
                                </Link>);
                        }
                    }
                }
                return colDef
            })
        ); // compact
            
        return {columns, dataSource};
    }


    getCatInstChanges(catInstChangesData){
        const COLS = foreignHoldings.COL_MAPPING;

        const dataSource = catInstChangesData.data;

        const columns = [
                {name: COLS.inst, flex: 1},
                {name: COLS.secNameIsin, flex: 3},
                {
                    name: diffColName, flex: 1, groupBy: false, type: 'number',
                    render: ({value})=>{
                        return <span>{SBUtils.shortNumber$Renderer(value, '$0')}</span>
                    },
                },
            ];

        // const toExcelNumStr = num=>numeral(num).format('0');
        const xlsData = dataSource.map(row=>{
            return [     
                {value: row[COLS.inst], style: {font:{ bold: true}}},
                {value: row[COLS.secName], },
                {value: row[COLS.isin], },
                {value: row[COLS[foreignHoldings.activePeriod]], },
                {value: row[COLS[foreignHoldings.compareToPeriod]], },
                {
                    value: row[diffColName],
                    style: {font: {color: { rgb: row[diffColName] > 0 ? "FF00FF00" : "FFFF0000"}}},

                },

            ];
        })
        const xlsColumns =
            [
                {title: COLS.inst, width: {wpx: 120}},
                {title: COLS.secName, width: {wpx: 200}},
                {title: COLS.isin},
                {title: foreignHoldings.activePeriod, },
                {title: foreignHoldings.compareToPeriod, },
                {title: diffColName},
            ];


        const res = {columns, dataSource, xls: [{columns: xlsColumns, data: xlsData}]};
        return res;
    }

    getCatSecChangesChartConfig(catSecChanges, catSecChangesSumChart){
        return {
            credits: {enabled: false},
            chart: {type: 'bar'},
            title: {text: null},

            tooltip: {
                formatter: function () {
                    return (
                        this.key + ' ' +
                        this.series.name + ': ' +
                        SBUtils.shortNumberRenderer(this.y)
                    );
                }
            },
            xAxis: {
                type: 'category',
                labels: {
                    formatter: function () {
                        const
                            diff = catSecChanges[this.value],
                            color = HighchartUtils.getTrendColor(diff),
                            res = `<span style="color:${color}">${this.value}</span>`;
                        return res;


                    }
                }
            },
            series: [{
                name: 'Fund Changes',
                data: catSecChangesSumChart
            }]
        }

    };

    getCatInstChangesSumChartConfig(catInstChangesSumChart) {
        return catInstChangesSumChart && {
            credits: {enabled: false},
            chart: {type: 'bar'},
            title: {text: null},
            legend: {enabled: false},
            xAxis: {
                type: 'category',
                labels: {
                    formatter: function () {
                        return '<a href="' +
                            '/institution/' + encodeURIComponent(this.value)
                            + '">' +
                            this.value + '</a>';

                    }
                }

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
                name: foreignHoldings.activeAndPrevPeriodsComparisonDesc + ' Changes',
                data: catInstChangesSumChart
            }]
        };
    }


    onCatInstChangesGroupByChange(groupBy) { this.setState({ catInstChangesGroupBy: groupBy } );}

    render(){
        const
            {
                catHoldersChartConfig, catInstChanges, catInstPivot,
                catSecChangesChartConfig, catInstChangesSumChartConfig
            } = this.state.category,
            {selectedCategory} = this.state;
        
        return (
            <div className={''}>

                <Helmet>
                    <title>{SBUtils.buildTitle(selectedCategory)}</title>
                </Helmet>
                <Panel className='panel-filters'>
                    <Panel.Body>
                        <Row>
                            <Col md={4} mdOffset={4}>
                                <Label>Category:</Label>
                                <Select
                                    autoFocus
                                    value={selectedCategory}
                                    placeholder={'Please select Category'}
                                    options={this.state.categoriesSelectOptions}
                                    onChange={this.onCategorySelected}
                                />
                            </Col>
                        </Row>
                    </Panel.Body>
                </Panel>

                {selectedCategory && <h2 className="text-center">Category {selectedCategory}</h2>}

                {selectedCategory && <ScoreCardsPanel
                    trendSumsDef={{category: this.state.selectedCategory}}
                />}

                <Row>
                    {catHoldersChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Holders</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={catHoldersChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>

                    }
                    {catInstChangesSumChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Change per Institution</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                {catInstChangesSumChartConfig &&
                                <ReactHighcharts config={catInstChangesSumChartConfig}/>}
                            </Panel.Body>
                        </Panel>
                    </Col>
                    }

                </Row>

                {catInstPivot &&
                <Panel className="panel-primary">
                    <Panel.Heading>
                        <Panel.Title componentClass="h3">Institutional Holdings per Security</Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <DataGrid
                            columns={catInstPivot.columns}
                            dataSource={catInstPivot.dataSource}
                            rowClassName={this.catInstPivotRowclass}
                            showZebraRows={false}
                            onGroupByChange={this.onCatInstPivtGroupByChange}
                        />
                    </Panel.Body>
                </Panel>
                }

                {catInstChanges &&
                <Panel className="panel-primary">
                    <Panel.Heading>
                        <Panel.Title componentClass="h3">Changes per Security</Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <Row>
                            <Col md={6}>
                                {false &&
                                <ReactExport.ExcelFile
                                    element={<button type="button" className="btn btn-default" aria-label="Left Align">
                                        <span className="glyphicon glyphicon-save-file" aria-hidden="true">Excel</span>
                                    </button>}
                                    filename={selectedCategory + ' Holdings'}>
                                    <ReactExport.ExcelFile.ExcelSheet
                                        dataSet={catInstChanges.xls}
                                        name={selectedCategory + ' Holdings'}/>
                                </ReactExport.ExcelFile>
                                }

                                <DataGrid
                                    columns={catInstChanges.columns}
                                    dataSource={catInstChanges.dataSource}
                                    rowClassName={this.catInstChangesRowclass}
                                    showZebraRows={false}
                                    defaultSortInfo={{ name: diffColName, dir: -1, type: 'number' }}

                                    groupBy={this.state.catInstChangesGroupBy}
                                    onGroupByChange={this.onCatInstChangesGroupByChange}
                                />
                            </Col>
                            <Col md={6}>
                                {catSecChangesChartConfig &&
                                <ReactHighcharts config={catSecChangesChartConfig}/>}

                            </Col>
                        </Row>
                    </Panel.Body>
                </Panel>
                }

            </div>
        )
    }
}


export {Category};
