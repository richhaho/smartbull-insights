import {find} from 'lodash'
import React, { Component } from 'react';

import './period-selector.css'

import Select from 'react-select'

import {foreignHoldings, ForeignHoldingsDataType} from "models/foreign_holdings";
import {SBConsts} from 'services/sb-consts'

class PeriodSelector extends Component {
    state = {
        selectedPeriod: '',
        selectedPeriodOptions: [{label: 'loading...', disabled: true}]
    }

    constructor(props) {
        super(props);

        this.onPeriodSelected = this.onPeriodSelected.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillMount() {
        const fromLS = localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.SELECTED_PERIOD);
        this.loadSelectedPeriodOptions(fromLS);
    }

    loadSelectedPeriodOptions(selectedPeriod = foreignHoldings.activePeriod){
        const
            shortTermPrefix = 'Short term (Mutual Funds)',
            longTermPrefix = 'Long Term (Pension, Gemel, Insurance)',
            baseSelectedPeriodOptions =
                foreignHoldings.foreignHoldingsDataType === ForeignHoldingsDataType.MutualFund ?
                    foreignHoldings.longTermPeriodsOrdered : // only long term for mutual funds
                    foreignHoldings.periodsOrdered,
            selectedPeriodOptions =
                baseSelectedPeriodOptions
                    .filter(period=>
                        period !== foreignHoldings.longTermPeriods.Q1_2017 &&
                        period !== foreignHoldings.shortTermPeriods.M1_2018)
                    .map(period=> {
                        const isLongTerm = foreignHoldings.isQuartly(period);
                        return {
                            label: [
                                foreignHoldings.periodToDisplayName[period],
                                (isLongTerm ? longTermPrefix : shortTermPrefix),
                            ].join(' - '),
                            value: period
                        }
                    })
            ;

        if (!find(selectedPeriodOptions, e=>e.value === selectedPeriod)){
            // period no longer interesting
            selectedPeriod = selectedPeriodOptions[0].value;
            foreignHoldings.setPeriods({activePeriod: selectedPeriod});
        }

        this.setState({selectedPeriodOptions,selectedPeriod});
        this.storeSelectedPeriod(selectedPeriod);
    }

    storeSelectedPeriod(selectedPeriod){
        localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.SELECTED_PERIOD, selectedPeriod);
    }

    componentDidMount() {
        // ... that takes care of the subscription...
        foreignHoldings.addEventListener(foreignHoldings.EVENTS.SEC_TYPE_CHANGE, this.handleChange);
    }

    componentWillUnmount() {
        foreignHoldings.removeEventListener(foreignHoldings.EVENTS.SEC_TYPE_CHANGE, this.handleChange);
    }

    handleChange(event) {
        if (event.type === foreignHoldings.EVENTS.SEC_TYPE_CHANGE){
            this.loadSelectedPeriodOptions();
        }
    }


    async onPeriodSelected(newSelectedPeriod){
        if (!newSelectedPeriod || !newSelectedPeriod.value){
            return;
        }

        const selectedPeriod = newSelectedPeriod.value;
        if (foreignHoldings.periodToDisplayName[selectedPeriod]){
            this.setState({selectedPeriod})
            if (this.props.onPeriodChangeCB){
                this.props.onPeriodChangeCB(selectedPeriod);
            }
            foreignHoldings.setPeriods({activePeriod: selectedPeriod});
            this.storeSelectedPeriod(selectedPeriod);

        }else{
            console.log(`error - no such period ${selectedPeriod}`)
        }
    }



    render(){
        return (
            <Select
                className='period-selector'
                value={this.state.selectedPeriod}
                placeholder={'Please select Period'}
                options={this.state.selectedPeriodOptions}
                onChange={this.onPeriodSelected}
                clearable={false}
            />        )
    }
}


export {PeriodSelector};
