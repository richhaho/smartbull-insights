import React, { Component } from 'react';
import Select from 'react-select'

import './search.css'

import {foreignHoldings} from "models/foreign_holdings";
import {SBUtils} from "services/sb-utils";

const EMPTY_SELECTION = {value: ''};

class Search extends Component {
    state = {
        selectedEntity: EMPTY_SELECTION,
        selectedEntityOptions: [{label: 'loading...', disabled: true}]
    }

    constructor(props) {
        super(props);

        this.onEntitySelected = this.onEntitySelected.bind(this);
    }

    componentDidMount() {
        this.loadSelectOptions();
    }


    loadSelectOptions(){
        // delay?
        let selectedEntityOptions = [];
        selectedEntityOptions = selectedEntityOptions.concat(
            foreignHoldings.getAllInstitutions().map(record=>{
                const {key: inst} = record;
                return {
                    label: 'Institution: ' + SBUtils.buildFilterLabel(record),
                    value: inst || 'N/A',
                    entityType: foreignHoldings.COL_MAPPING.inst,
                    route: '/institution/' + inst,
            }
            })
        );

        selectedEntityOptions = selectedEntityOptions.concat(
            foreignHoldings.getAllCategories().map(record=>{
                const {key: cat} = record;
                return {
                    label: 'Category: ' + SBUtils.buildFilterLabel(record),
                    value: cat || 'N/A',
                    entityType: foreignHoldings.COL_MAPPING.category,
                    route: '/category/' + cat,
                }
            })
        );

        selectedEntityOptions = selectedEntityOptions.concat(
            foreignHoldings.getAllIssuers().map(record=>{
                const {key: issuer} = record;
                return {
                    label: 'Issuer: ' + SBUtils.buildFilterLabel(record),
                    value: issuer || 'N/A',
                    entityType: foreignHoldings.COL_MAPPING.issuer,
                    // route: '/issuer/' + value; // future, when there's a page
                    route: '/security/?issuer=' + issuer,
                }
            })
        );

        selectedEntityOptions = selectedEntityOptions.concat(
            foreignHoldings.getAllSecurities().map(sec=>{
                const secWithIsin = foreignHoldings.buildSecWithIsin(
                    sec[foreignHoldings.COL_MAPPING.secName],
                    sec[foreignHoldings.COL_MAPPING.isin]);
                return {
                    label: 'Fund: ' + SBUtils.buildFilterLabel(sec, {overrideKey: secWithIsin}),
                    value: secWithIsin || 'N/A',
                    entityType: foreignHoldings.COL_MAPPING.secNameIsin,
                    route: '/security/' + secWithIsin,
                }
            })
        );

        this.setState({selectedEntityOptions});
    }

    componentWillReceiveProps(nextProps) {
        if (
            (this.props.secType !== nextProps.secType)
        ){
            this.loadSelectOptions();
        }

        const {location} = nextProps;
        // console.log("search componentWillReceiveProps", nextProps)
        if (this.props.location !== location) {
            if (this.state.selectedEntity.route &&
                (this.state.selectedEntity.route !== location.pathname + location.search)){
                this.setState({selectedEntity: EMPTY_SELECTION})
            }
        }
    }

    onEntitySelected(newSelectedEntity){
        if (!newSelectedEntity || !newSelectedEntity.value){
            this.setState({selectedEntity: EMPTY_SELECTION});
            return;
        }
        // console.log("newSelectedEntity", newSelectedEntity)
        this.setState({selectedEntity: newSelectedEntity});
        this.props.history.push(newSelectedEntity.route);
    }

    render(){
        return (
            <div>
                <Select
                    className="search-select"
                    value={this.state.selectedEntity.value}
                    placeholder={'Search security, issuer, institution, category'}
                    options={this.state.selectedEntityOptions}
                    onChange={this.onEntitySelected}
                    clearable={true}
                    arrowRenderer={null}
                    onFocus={this.props.onFocus}
                    onBlur={this.props.onBlur}
                />
            </div>
        )
    }
}


export {Search};
