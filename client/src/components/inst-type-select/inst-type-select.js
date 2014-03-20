import React, { Component } from 'react';

import './inst-type-select.css'

import Select from 'react-select'

class InstTypeSelector extends Component {
    state = {
        selectedInstType: '',
    }

    constructor(props) {
        super(props);

        this.onInstSelected = this.onInstSelected.bind(this);
        this.selectedInstTypeOptions = [
            'Short term (Mutual Funds)',
            'Long Term (Pension, Gemel, Insurance)',
        ].map(e=>{
            return {label: e, value: e};
        });
    }

    async componentWillMount(){
    }


    async onInstSelected(newSelectedInstType){
        if (!newSelectedInstType || !newSelectedInstType.value){
            return;
        }

        const selectedInstType = newSelectedInstType.value;
        this.setState({selectedInstType})
    }



    render(){
        return (
            <Select
                value={this.state.selectedInstType}
                placeholder={'Institution Type'}
                options={this.selectedInstTypeOptions}
                onChange={this.onInstSelected}
                clearable={false}
            />        )
    }
}


export {InstTypeSelector};
