import {sortBy, find, some, isFunction} from 'lodash'

import React, { Component } from 'react';
import {
    Link,
} from "react-router-dom";
import {Helmet} from 'react-helmet'

import Row from 'react-bootstrap/lib/Row'
import Col from 'react-bootstrap/lib/Col'
import Panel from 'react-bootstrap/lib/Panel'
import Label from 'react-bootstrap/lib/Label'

import Select from 'react-select'
import DataGrid from '@zippytech/react-datagrid-pro'

import {ReactHighcharts, HighchartUtils} from 'services/highchart-utils'

import {foreignHoldings} from "models/foreign_holdings";
import {SBUtils} from 'services/sb-utils'
import {SBConsts} from 'services/sb-consts'
import {ScoreCardsPanel} from "components/scorecard/scorecards-panel";
import {HoldingDiffTypeFilter, HoldingDiffTypeFilterTypes} from "components/holding-diff-type-filter/holding-diff-type-filter";

import './institution.css'

class Institution extends Component {
    state = {
        selectedInst : null,
        instsSelectOptions: [{label: 'loading...', disabled: true}],
        institution: {},
        instHoldingsChangesGroupBy: [],

        instHoldingsActiveFilter: HoldingDiffTypeFilterTypes.all,

        selectedManagingCompany : null,
        managingCompaniesSelectOptions: [{label: 'loading...', disabled: true}],
    }

    constructor(props) {
        super(props);

        this.onInstSelected = this.onInstSelected.bind(this);
        this.onManagingCompanySelected = this.onManagingCompanySelected.bind(this);
        this.onInstHoldingsChangesGroupByChange = this.onInstHoldingsChangesGroupByChange.bind(this);
        this.onInstHoldingsFilterChanged = this.onInstHoldingsFilterChanged.bind(this);
    }


    async componentWillMount(){
        this.setSelectors();

        await this.selectFromRoute(this.props);
    }


    async setSelectors() {
        const instsSelectOptions = foreignHoldings.getAllInstitutions()
            .map(inst => {
                return {
                    label: SBUtils.buildFilterLabel(inst),
                    value: inst.key,
                }
            });
        const managingCompaniesSelectOptions = sortBy(foreignHoldings.getAllManagingCompanies(), e=>-e.instsCount)
            .map(managingCompanyEntity => {
                const label = SBUtils.buildFilterLabel(managingCompanyEntity),
                    instCountLabel = `, ${managingCompanyEntity.instsCount} Institution${managingCompanyEntity.instsCount > 1 ? 's' : ''})`
                return {
                    label: label.replace(/\)$/, instCountLabel),
                    value: managingCompanyEntity.key,
                }
            });

        await this.setState({instsSelectOptions, managingCompaniesSelectOptions});
    }

    async selectFromRoute(props) {
        const
            selectedInst = props.match.params.instName,
            selectedManagingCompanyFromSearch = props.location.search.slice(1).split('=')[1];

        if (selectedInst) {
            this.clearSelectedManagingCompany();
            const existQ = {institution: selectedInst};
            if (foreignHoldings.exist(existQ)) {
                await this.setState({selectedInst: selectedInst});
                this.loadInst();
            } else {
                console.log('selectFromRoute - warning - unknown', existQ)
            }
        }else if (selectedManagingCompanyFromSearch) {
            this.clearSelectedInst();
            const selectedManagingCompany = decodeURIComponent(selectedManagingCompanyFromSearch);
            const existQ = {managingCompany: selectedManagingCompany};
            if (foreignHoldings.exist(existQ)) {
                await this.setState({selectedManagingCompany});
                this.loadInst();
            } else {
                console.log('selectFromRoute - warning - unknown', existQ)
            }
        }
    }

    async componentWillReceiveProps(nextProps) {
        if (
            (this.props.secType !== nextProps.secType) ||
            (this.props.periodType !== nextProps.periodType)
        ){
            await this.setSelectors();
            if (find(this.state.instsSelectOptions, e=>e.value === this.state.selectedInst)){
                this.loadInst();
            }else {
                this.setState({selectedInst: '', institution: {}});
                this.props.history.push('/institution/');
            }
        } else if (this.props.period !== nextProps.period){
            this.loadInst();
        } else if (this.props.location.pathname !== nextProps.location.pathname) {
            // route changed
            this.selectFromRoute(nextProps);
        }
    }

    async loadInst(){
        const
            instName = this.state.selectedInst,
            managingCompany = this.state.selectedManagingCompany;
        if (instName || managingCompany){
            const
                managingCompanyInsts = managingCompany && foreignHoldings.getManagingCompanyInsts(managingCompany),

                {
                    instCategoriesChangesSecDrilldownSeries,
                    instCategoriesBought,
                    instCategoriesChartData,
                    instCategoriesChangesSumChart

                } = foreignHoldings.getInstCategoriesChartsData(instName, managingCompany),
                instRawData = foreignHoldings.getInstitutionsRawData(instName, managingCompany),
                institution = {
                    name: instName,
                    managingCompanyInstsGridConfig: managingCompanyInsts && this.getManagingCompanyInstsGridConfig(managingCompanyInsts),
                    instCategoriesChartConfig: this.getInstCategoriesChartConfig(instCategoriesChartData),
                    instCategoriesChangesSumChartConfig: this.getInstCategoriesChangesSumChartConfig(instCategoriesChangesSumChart, instCategoriesBought, instCategoriesChangesSecDrilldownSeries),
                    instHoldingsGridConfig: this.getInstHoldingsGridConfig(instRawData)
                };

            this.setState({institution});
        }
    }

    async onInstSelected(newSelectedInst){
        const selectedInst = newSelectedInst && newSelectedInst.value;
        if (selectedInst){
            this.clearSelectedManagingCompany();
            await this.setState({selectedInst});
            this.loadInst();
            this.props.history.push(`/institution/${selectedInst}`);
        }else{
            this.clearSelectedInst();
            this.setState({institution: {}});
            this.props.history.push('/institution/');
        }
    }

    async onManagingCompanySelected(newSelectedManagingCompany){
        const selectedManagingCompany = newSelectedManagingCompany && newSelectedManagingCompany.value;
        if (selectedManagingCompany){
            this.clearSelectedInst();
            await this.setState({selectedManagingCompany});
            this.props.history.push(`/institution/?managing=${selectedManagingCompany}`);
            this.loadInst();
        } else {
            this.clearSelectedManagingCompany();
            this.setState({institution: {}});
            this.props.history.push('/institution/');
        }
    }

    clearSelectedInst(){
        this.setState({selectedInst: ''});
    }

    clearSelectedManagingCompany(){
        this.setState({selectedManagingCompany: ''});
    }

    getManagingCompanyInstsGridConfig(managingCompanyInsts){
        const COLS = foreignHoldings.COL_MAPPING,
            columns = [
                {
                    name: COLS.inst, flex: 3, header: 'Institution',
                    render: ({value, data}) => {
                        return <Link to={`/institution/${value}`}>{value}</Link>
                    }
                },
                {name: 'compareToPeriodHolding', type: 'number', header: foreignHoldings.compareToPeriodShortDisplayName + ' Holdings'},
                {name: 'activePeriodHolding', type: 'number', header: foreignHoldings.activePeriodShortDisplayName + ' Holdings'},
                {name: SBConsts.DEFAULT_COL_NAMES.DIFF, type: 'number', header: foreignHoldings.activeAndPrevPeriodsComparisonDesc + ' Change'},
            ].map(colDef => {
                //defaults:
                colDef.flex = colDef.flex || 1;
                if (!isFunction(colDef.render)){
                    colDef.render = ({value})=>{
                        return <span className={SBUtils.diffToClass(value)}>
                        {SBUtils.shortNumber$Renderer(value)}
                        </span>
                    }
                }
                return colDef;
            });

        return {dataSource: managingCompanyInsts, columns}
    }


    getInstCategoriesChartConfig(data){
        return HighchartUtils.createPieChartConfig({
            series: [{
                name: 'categories of ' + this.state.selectedInst,
                data: data || []
            }]
        })
    }

    getInstCategoriesChangesSumChartConfig(instCategoriesChangesSumChart, instCategoriesBought, instCategoriesChangesSecDrilldownSeries){
        let reactParentComponent = this;
        return {
            credits: {enabled: false},
            chart: {
                type: 'bar',
                events: {
                    drilldown: function (e) {
                        const targetHtml = e.originalEvent && e.originalEvent.target,
                            clickedId = e.seriesOptions && e.seriesOptions.id;
                        // clicked on label is redirect, not drill down
                        if (targetHtml && (/DIV/i.test(targetHtml.nodeName))) {
                            e.preventDefault();
                            if (clickedId) {
                                setTimeout(() => reactParentComponent.props.history.push(`/category/${clickedId}`), 1);
                            }
                        } else {
                            this.setTitle(null, {
                                text: "Category: " + e.point.name
                            });
                        }

                    },
                    drillup: function (e) {
                        this.setTitle(null, {text: ""});
                    }
                }
            },
            title: {text: null},
            xAxis: {
                type: 'category',
                labels: {
                    useHTML:true,
                    style:{whiteSpace:'normal'},
                    formatter: function () {
                        const diff = instCategoriesBought[this.value],
                            color = HighchartUtils.getTrendColor(diff),
                            value = this.value.length > 40 ? (this.value.slice(0, 37) + '...') : this.value;

                        // console.log("here", {diff, color, value})
                        // return `<span class="inst-cat-changes-x-labels" style="color:${color}">${this.value}</span>`;
                        return `<div align="center" style="color:${color}" class="inst-cat-changes-x-labels">${value}</div>`;
                    }
                }

            },
            tooltip:{
                formatter: function () {
                    return (
                        this.key + ' ' +
                        this.series.name + ': ' +
                        SBUtils.shortNumberRenderer(this.y)
                    );
                }
            },
            series: [{
                name: foreignHoldings.activeAndPrevPeriodsComparisonDesc + ' Changes',
                data: instCategoriesChangesSumChart
            }],
            drilldown: {
                series: instCategoriesChangesSecDrilldownSeries
            }
        }
    }

    getInstHoldingsGridConfig(instRawData){
        const COLS = foreignHoldings.COL_MAPPING;

        const columns = [
            {
                name: 'secNameIsin', header: COLS.secNameIsin, flex: 3,
                render: ({value}) => {
                    return <Link to={`/security/${value}`}>{value}</Link>
                }
            },
            {
                name: 'category',
                groupBy: true,
                render: ({value}) => {
                    return <Link to={`/category/${value}`}>{value}</Link>
                }
            },
            {
                name: 'compareToPeriodHolding',
                type: 'number',
                header: foreignHoldings.compareToPeriodShortDisplayName + ' Holdings'
            },
            {
                name: 'activePeriodHolding',
                type: 'number',
                header: foreignHoldings.activePeriodShortDisplayName + ' Holdings'
            },
            {
                name: 'activePeriodDiff',
                header: 'Change',
                type: 'number',
            },
        ].map(colDef=>{
            //defaults:
            colDef.flex = colDef.flex || 1;
            if (!isFunction(colDef.render)){
                colDef.render = ({value})=>{
                    return <span className={SBUtils.diffToClass(value)}>
                        {SBUtils.shortNumber$Renderer(value)}
                        </span>
                }
            }
            colDef.groupBy = colDef.groupBy || false;

            return colDef;
        });


        const dataSource = instRawData.filter(row=>(
            some([
                (row.activePeriodHolding),
                (row.compareToPeriodHolding),
                (row.activePeriodDiff),
            ].map(Math.abs), e=>e>0.1)
        ));
        return {columns, dataSource};
    }
    onInstHoldingsChangesGroupByChange(groupBy) { this.setState({ instHoldingsChangesGroupBy: groupBy } );}

    onInstHoldingsFilterChanged(newFilter){
        this.setState({instHoldingsActiveFilter: newFilter});
    }



    render(){
        const
            {
                managingCompanyInstsGridConfig,
                instCategoriesChartConfig,
                instCategoriesChangesSumChartConfig,
                instHoldingsGridConfig,
            } = this.state.institution;


        const instHoldingsGridFilteredDS = instHoldingsGridConfig && (() => {
            switch (this.state.instHoldingsActiveFilter){
                default:
                case HoldingDiffTypeFilterTypes.all:
                    return instHoldingsGridConfig.dataSource;
                case HoldingDiffTypeFilterTypes.bought:
                    return instHoldingsGridConfig.dataSource.filter(holding=>holding[SBConsts.DEFAULT_COL_NAMES.ACTIVE_PERIOD_DIFF] > 0);
                case HoldingDiffTypeFilterTypes.sold:
                    return instHoldingsGridConfig.dataSource.filter(holding=>holding[SBConsts.DEFAULT_COL_NAMES.ACTIVE_PERIOD_DIFF] < 0);
            }
        })();

        const {selectedInst, selectedManagingCompany} = this.state,
            gotSmtngSelected = !!(selectedInst || selectedManagingCompany);
        return (
            <div className={''}>
                <Helmet>
                    <title>{SBUtils.buildTitle(selectedInst)}</title>
                </Helmet>
                <Panel className='panel-filters'>
                    <Panel.Body>
                        <Row>
                            <Col md={3} mdOffset={3}>
                                <Label>Institution Name</Label>
                                <Select
                                    autoFocus
                                    value={selectedInst}
                                    placeholder={'Please select Institution'}
                                    options={this.state.instsSelectOptions}
                                    onChange={this.onInstSelected}
                                />
                            </Col>

                            <Col md={3}>
                                <Label>Managing Company</Label>
                                <Select
                                    value={this.state.selectedManagingCompany}
                                    options={this.state.managingCompaniesSelectOptions}
                                    placeholder="Please Select Managing Company"
                                    onChange={this.onManagingCompanySelected}
                                />
                            </Col>
                        </Row>
                    </Panel.Body>
                </Panel>
                {selectedInst && <h2 className='text-center'>Institution {selectedInst}</h2>}

                {gotSmtngSelected && <ScoreCardsPanel
                    trendSumsDef={{institution: selectedInst, managingCompany: this.state.selectedManagingCompany}}
                />}

                {managingCompanyInstsGridConfig &&
                <Row>
                    <Col sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Institutions Managed by {this.state.selectedManagingCompany}</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <DataGrid
                                    columns={managingCompanyInstsGridConfig.columns}
                                    dataSource={managingCompanyInstsGridConfig.dataSource}
                                    defaultSortInfo={{ name: 'activePeriodHolding', type: 'number', dir: -1 }}
                                    showZebraRows={false} />
                            </Panel.Body>
                        </Panel>
                    </Col>
                </Row>}


                <Row>
                    {instCategoriesChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Holdings per Category</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={instCategoriesChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>

                    }
                    {instCategoriesChangesSumChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Changes per Category</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={instCategoriesChangesSumChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>
                    }
                </Row>

                {instHoldingsGridConfig &&
                <Row>
                    <Col sm={12}>
                    <Panel className="panel-primary">
                        <Panel.Heading>
                            <Panel.Title componentClass="h3">Holdings Breakdown</Panel.Title>
                        </Panel.Heading>
                        <Panel.Body>
                            <div className="flex-col flex-align-centered">
                                <HoldingDiffTypeFilter onChange={this.onInstHoldingsFilterChanged}/>
                                <DataGrid
                                    columns={instHoldingsGridConfig.columns}
                                    dataSource={instHoldingsGridFilteredDS}
                                    showZebraRows={false}

                                    groupBy={this.state.instHoldingsChangesGroupBy}
                                    onGroupByChange={this.onInstHoldingsChangesGroupByChange}
                                />
                            </div>
                        </Panel.Body>
                    </Panel>
                    </Col>
                </Row>
                }

            </div>
        )
    }
}


export {Institution};
