import {isEmpty, isFunction, find, get} from 'lodash'

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

import {ReactHighcharts, HighchartUtils} from 'services/highchart-utils'

import {foreignHoldings} from "models/foreign_holdings";
import {SBUtils} from 'services/sb-utils'
import {SBConsts} from 'services/sb-consts'
import {ScoreCardsPanel} from "components/scorecard/scorecards-panel";
import {HoldingDiffTypeFilter, HoldingDiffTypeFilterTypes} from "components/holding-diff-type-filter/holding-diff-type-filter";

import './security.css'

const COLS = foreignHoldings.COL_MAPPING;

class Security extends Component {
    state = {
        selectedSecName: '',
        selectedSecIsin: '',
        secsSelectOptions: [{label: 'loading...', value: '', disabled: true}],
        security: {},

        selectedIssuer: '',
        issuerSelectOptions: [{label: 'loading...', value: '', disabled: true}],

        secHoldingsActiveFilter: HoldingDiffTypeFilterTypes.all
    }

    constructor(props) {
        super(props);

        this.onSecSelected = this.onSecSelected.bind(this);
        this.onIssuerSelected = this.onIssuerSelected.bind(this);
        this.onSecHoldingsFilterChanged = this.onSecHoldingsFilterChanged.bind(this);
    }

    componentWillMount(){
        this.setSelectors();

        this.selectFromRoute(this.props);
    }

    async setSelectors() {
        const secsSelectOptions = foreignHoldings.getAllSecurities()
            .map(sec => {
                const
                    isin = sec[COLS.isin],
                    secName = sec[COLS.secName];

                return {
                    label: SBUtils.buildFilterLabel(sec, {overrideKey: foreignHoldings.buildSecWithIsin(secName, isin)}),
                    value: isin,
                }
            });
        const issuerSelectOptions = foreignHoldings.getAllIssuers()
            .map(issuer => {
                return {
                    value: issuer.key,
                    label: SBUtils.buildFilterLabel(issuer)
                }
            });
        await this.setState({secsSelectOptions, issuerSelectOptions});
    }

    async selectFromRoute(props) {
        const
            secName = props.match.params.secName,
            issuerFromSearch= props.location.search.slice(1).split('=')[1];

        // console.log("selectFromRoute", {secName, issuer: issuerFromSearch})
        if (secName){
            if (secName === foreignHoldings.buildSecWithIsin(this.state.selectedSecName, this.state.selectedSecIsin)){
                return;
            }
            this.clearSelectedIssuer();
            let selectedSecName = secName;
            // normalize sec name to sec name and isin
            const secMetadata = selectedSecName && foreignHoldings.getSecMetadataByName(selectedSecName);
            if (secMetadata) {
                await this.setState({
                    selectedSecName: secMetadata[COLS.secName],
                    selectedSecIsin: secMetadata[COLS.isin]
                });
                const shouldBeRoute = '/security/' + foreignHoldings.buildSecWithIsin(
                    secMetadata[COLS.secName],
                    secMetadata[COLS.isin]);
                if (shouldBeRoute !== this.props.location.pathname){
                    this.props.history.replace(shouldBeRoute);
                }

                this.loadSec('selectFromRoute ' + secName);
            } else if (selectedSecName) {
                this.props.history.replace('/security');
                console.log(`selectFromRoute warning - unknown sec "${selectedSecName}"`)
            }
        }else if (issuerFromSearch){
            const issuer = decodeURIComponent(issuerFromSearch);
            if (issuer === this.state.selectedIssuer){
                return;
            }
            this.clearSelectedSecurity();
            if (foreignHoldings.exist({issuer})) {
                await this.setState({selectedIssuer: issuer});
                this.loadSec('selectFromRoute ' + issuer);
            } else {
                console.log(`selectFromRoute warning - unknown issuer "${issuer}"`)
            }
        }

    }

    async componentWillReceiveProps(nextProps) {
        if (
            (this.props.secType !== nextProps.secType) ||
            (this.props.periodType !== nextProps.periodType)
        ){
            await this.setSelectors();
            const found =
                find(this.state.issuerSelectOptions, e=>e.value === this.state.selectedIssuer) ||
                find(this.state.secsSelectOptions, e=>e.value === this.state.selectedSecIsin);
            if (found){
                this.loadSec(`componentWillReceiveProps secType change to ${nextProps.secType}`);
                // console.log("found", found || 'nada')
            }else{
                this.clearSelectedSecurity();
                this.clearSelectedIssuer();
                this.setState({security: {}});
                this.props.history.push('/security/');
            }
        } else if (this.props.period !== nextProps.period){
            this.loadSec(`componentWillReceiveProps period change to ${nextProps.period}`);
        } else if (this.props.location !== nextProps.location) {
            // route changed
            this.selectFromRoute(nextProps);
        }
    }

    async loadSec(caller){
        const
            secName = this.state.selectedSecName,
            issuerName = this.state.selectedIssuer
        ;
        if (secName || issuerName){
            // console.log("loadSec", {caller, secName, issuerName})
            const
                secMetadata = foreignHoldings.getSecMetadataByName(this.state.selectedSecIsin),
                issuerSecurites = issuerName && foreignHoldings.getIssuerSecurites(issuerName),
                {secChangesChartData, secHolderBought} =
                    foreignHoldings.getSecChangesChartData(secName, issuerName),
                secHoldersChartData = foreignHoldings.getSecHoldersChartData(secName, issuerName),
                secRawData = foreignHoldings.getSecurityRawData(secName, issuerName),
                security = {
                    name: secName,
                    secMetadata,
                    issuerSecuritesGridConfig: issuerSecurites && this.getIssuerSecuritesGridConfig(issuerSecurites),
                    secChangesChartConfig: this.getSecChangesChartConfig(secChangesChartData, secHolderBought),
                    secHoldersChartConfig: this.getSecHoldersChartConfig(secName, secHoldersChartData),
                    secHoldingsGridConfig: this.getSecHoldingsGridConfig(secRawData),
                    empty: isEmpty(secRawData)
                };
                    
            this.setState({security});
        }
    }


    clearSelectedSecurity(){
        this.setState({selectedSecName: '', selectedSecIsin: '', security: {}});
    }

    clearSelectedIssuer(){
        this.setState({selectedIssuer: ''});
    }

    async onSecSelected(newSelectedSec){
        if (newSelectedSec){
            const
                isin = newSelectedSec.value,
                secMetadata = foreignHoldings.getSecMetadataByName(isin);
            // console.log("newSelectedSec",newSelectedSec, secMetadata)
            this.clearSelectedIssuer();
            const
                selectedSecName= secMetadata[COLS.secName],
                selectedSecIsin= secMetadata[COLS.isin];
            await this.setState({selectedSecName, selectedSecIsin});
            this.props.history.push('/security/' + foreignHoldings.buildSecWithIsin(selectedSecName, selectedSecIsin));
            this.loadSec('onSecSelected');
        }else{
            this.clearSelectedSecurity();
            this.setState({security: {}});
            this.props.history.push('/security/');
        }
    }

    async onIssuerSelected(newSelectedIssuer){
        if (newSelectedIssuer && newSelectedIssuer.value){
            this.clearSelectedSecurity();
            await this.setState({selectedIssuer: newSelectedIssuer.value});
            this.props.history.push('/security/?issuer=' + newSelectedIssuer.value);
            this.loadSec('onIssuerSelected');
        }else{
            this.clearSelectedIssuer();
            this.setState({security: {}});
            this.props.history.push('/security/');
        }
    }

    onSecHoldingsFilterChanged(newFilter){
        this.setState({secHoldingsActiveFilter: newFilter});
    }


    getSecHoldersChartConfig(secName, secHoldersChartData){
        return HighchartUtils.createPieChartConfig({
            series: [{
                name: 'holders of ' + secName,
                data: secHoldersChartData || []
            }]
        })

    }

    getSecChangesChartConfig(secChangesChartData, secHolderBought){
        return {
            credits: {enabled: false},
            chart: {type: 'bar'},
            title: {text: null},
            tooltip:{
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
                        const diff = secHolderBought[this.value],
                            color = HighchartUtils.getTrendColor(diff),
                            res = `<span style="${color}:">${this.value}</span>`;
                        return res;


                    }
                }
            },
            series: [{
                name : foreignHoldings.activeAndPrevPeriodsComparisonDesc + ' Change',
                data: secChangesChartData
            }]
        }
    }

    getIssuerSecuritesGridConfig(issuerSecurites){
        const
            columns = [
                {
                    name: COLS.secNameIsin, flex: 3,
                    render: ({value, data}) => {
                        return <Link to={`/security/${value}`}>{value}</Link>
                    }
                },
                {name: 'compareToPeriodHolding', type: 'number', header: foreignHoldings.compareToPeriodShortDisplayName + ' Holdings'},
                {name: 'activePeriodHolding', type: 'number', header: foreignHoldings.activePeriodShortDisplayName + ' Holdings'},
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

        return {dataSource: issuerSecurites, columns}
    }

    getSecHoldingsGridConfig(secRawData){
        const columns = [
            {
                name: COLS.inst, flex: 3,
                render: ({value}) => {
                    return <Link to={`/institution/${value}`}>{value}</Link>
                }
            },
            {name: 'compareToPeriodHolding', type: 'number', header: foreignHoldings.compareToPeriodShortDisplayName + ' Holdings'},
            {name: 'activePeriodHolding', type: 'number', header: foreignHoldings.activePeriodShortDisplayName + ' Holdings'},
            {name: SBConsts.DEFAULT_COL_NAMES.DIFF, type: 'number', header: 'Change'},
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

            return colDef;
        });

        return {columns, dataSource: secRawData};
    }

    renderCurrSecurity(){
        const
            {
                issuerSecuritesGridConfig,
                secChangesChartConfig,
                secHoldersChartConfig,
                secHoldingsGridConfig,
            } = this.state.security;

        // todo no point in doing this in render, should be done upon state change.
        const secHoldingsGridFilteredDS = secHoldingsGridConfig && (() => {
            switch (this.state.secHoldingsActiveFilter){
                default:
                case HoldingDiffTypeFilterTypes.all:
                    return secHoldingsGridConfig.dataSource;
                case HoldingDiffTypeFilterTypes.bought:
                    return secHoldingsGridConfig.dataSource.filter(holding=>holding[SBConsts.DEFAULT_COL_NAMES.DIFF] > 0);
                case HoldingDiffTypeFilterTypes.sold:
                    return secHoldingsGridConfig.dataSource.filter(holding=>holding[SBConsts.DEFAULT_COL_NAMES.DIFF] < 0);
            }
        })()

        return (
            <div>
                <ScoreCardsPanel
                    trendSumsDef={{security: this.state.selectedSecIsin, issuer: this.state.selectedIssuer}}
                />

                {issuerSecuritesGridConfig &&
                <Row>
                    <Col sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Holding in {this.state.selectedIssuer} Securities</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <DataGrid
                                    columns={issuerSecuritesGridConfig.columns}
                                    dataSource={issuerSecuritesGridConfig.dataSource}
                                    showZebraRows={false} />
                            </Panel.Body>
                        </Panel>
                    </Col>
                </Row>}

                <Row>
                    {secHoldersChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Holders</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={secHoldersChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>

                    }
                    {secChangesChartConfig &&
                    <Col md={6} sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Institution Changes</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <ReactHighcharts config={secChangesChartConfig}/>
                            </Panel.Body>
                        </Panel>
                    </Col>
                    }
                </Row>

                {secHoldingsGridConfig &&
                <Row>
                    <Col sm={12}>
                        <Panel className="panel-primary">
                            <Panel.Heading>
                                <Panel.Title componentClass="h3">Institution Changes</Panel.Title>
                            </Panel.Heading>
                            <Panel.Body>
                                <div className="flex-col flex-align-centered">
                                    <HoldingDiffTypeFilter onChange={this.onSecHoldingsFilterChanged}/>
                                    <DataGrid
                                        columns={secHoldingsGridConfig.columns}
                                        dataSource={secHoldingsGridFilteredDS}
                                        defaultSortInfo={{ name: 'activePeriodHolding', type: 'number', dir: -1 }}
                                        showZebraRows={false}
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

    renderSecurityOrEmpty(gotSmtngSelected){
        if (!gotSmtngSelected){
            return null;
        }

        if (this.state.security.empty){
            // selected but no holdings
            return <h3 className='text-center'>No holdings for {foreignHoldings.activePeriodDisplayName}</h3>;
        }

        return this.renderCurrSecurity();
    }

    render(){
        const
            {selectedSecName, selectedIssuer} = this.state,
            gotSmtngSelected = !!(selectedSecName || selectedIssuer),
            secMetadata = get(this.state, `security.secMetadata`),
            category = secMetadata && secMetadata[COLS.category]
        ;
        return (
            <div className={''}>
                <Helmet>
                    <title>{SBUtils.buildTitle(selectedSecName)}</title>
                </Helmet>
                <Panel className='panel-filters'>
                    <Panel.Body>
                        <Row>
                            <Col md={3} mdOffset={3} lg={5} lgOffset={1}>
                                <Label>Security</Label>
                                <Select
                                    id={'secs-select'}
                                    autoFocus
                                    value={this.state.selectedSecIsin}
                                    placeholder={'Please select Security'}
                                    options={this.state.secsSelectOptions}
                                    onChange={this.onSecSelected}
                                />
                            </Col>
                            <Col md={3} lg={5}>
                                <Label>Issuer</Label>
                                <Select
                                    id={'issuer-select'}
                                    autoFocus
                                    value={selectedIssuer}
                                    placeholder={'Please select Issuer'}
                                    options={this.state.issuerSelectOptions}
                                    onChange={this.onIssuerSelected}
                                />
                            </Col>

                        </Row>
                    </Panel.Body>
                </Panel>

                {selectedSecName && <h2 className='text-center'>Security {selectedSecName}</h2>}
                {secMetadata && (
                    <div className='text-center flex-row sec-metadata-row'>
                        <h5 >Isin: {secMetadata[COLS.isin] }</h5>
                        {secMetadata[COLS.securityTicker] && <h5 >TickerL {secMetadata[COLS.securityTicker] }</h5>}
                        <h5 >Category: {<Link to={`/category/${category}`}>{category}</Link> }</h5>
                        <h5 >Asset Class: {secMetadata[COLS.assetClass] }</h5>
                        <h5 >Currency: {secMetadata[COLS.currency] }</h5>
                    </div>
                ) }
                {/*{this.state.selectedIssuer && <h2 className='text-center'>Securities of Issuer {this.state.selectedIssuer}</h2>}*/}

                {this.renderSecurityOrEmpty(gotSmtngSelected)}

            </div>
        )
    }
}


export {Security};
