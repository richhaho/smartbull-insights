import {flatten, find, cloneDeep} from 'lodash'
import React, { Component } from 'react';

import './sec-type-selector.css'

import Label from 'react-bootstrap/lib/Label';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem'

import {SBConsts} from 'services/sb-consts'
import {foreignHoldings, ForeignHoldingsDataType} from "models/foreign_holdings";

class SecTypeSelector extends Component {
    state = {
        selectedSecType: '',
        selectedSecTypeOptions: [
            {name: 'Foreign Funds', dataType: ForeignHoldingsDataType.MutualFund},
            {name: 'Foreign ETFs', dataType: ForeignHoldingsDataType.ETF, comingSoon: true},
            {name: 'Foreign Stocks/Bonds', comingSoon: true},
            {name: 'IL Stocks/Bonds', comingSoon: true},
        ]
    }

    constructor(props) {
        super(props);

        this.onSecTypeSelected = this.onSecTypeSelected.bind(this);
    }

    async componentWillMount(){


        const selectedSecTypeOptions = cloneDeep(this.state.selectedSecTypeOptions);
        if (this.props.user && this.props.user.sbadm){
            const etfItem = find(selectedSecTypeOptions, e=>e.name === 'Foreign ETFs');
            etfItem.comingSoon = false;
            this.setState({selectedSecTypeOptions});
        }

        const
            secTypeFromLS = localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.SEC_TYPE),
            secTypeFromLSExists = !!find(selectedSecTypeOptions, e=>e.name === secTypeFromLS),
            selectedSecType = (secTypeFromLSExists && secTypeFromLS) ||
                selectedSecTypeOptions[0].name;
        this.setState({selectedSecType});
    }


    async onSecTypeSelected(newSelectedSecType){
        const selectedSecType = find(this.state.selectedSecTypeOptions, e=>e.name === newSelectedSecType);
        if (selectedSecType){
            if (selectedSecType.comingSoon){
                if (this.props.comingSoonClicked){
                    this.props.comingSoonClicked(selectedSecType)
                }
                alert('Soon...')
            }else{
                localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.SEC_TYPE, newSelectedSecType);
                localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.FOREIGN_HOLDINGS_DATA_TYPE, selectedSecType.dataType);
                this.setState({selectedSecType: newSelectedSecType})
                foreignHoldings.changeForeignHoldingsDataType(selectedSecType.dataType);
            }
        }else{
            console.log(`error - no such period ${selectedSecType}`)
        }
    }



    render(){
        const
            comingSoon = <Label bsStyle="primary">Soon</Label>,
            renderSecTypeMenuItem = this.props.asDropdown ?
                (secTypeParams => {
                    if (this.state.selectedSecType === secTypeParams.name) {
                        return null;
                    }

                    const base = (
                        <MenuItem
                            eventKey={secTypeParams.name}
                            key={`MenuItem-${secTypeParams.name}`}>
                            {secTypeParams.name}{secTypeParams.comingSoon && comingSoon}
                        </MenuItem>);
                    return secTypeParams.putDividerAfter ?
                        [base, <MenuItem key={`divider-${secTypeParams.name}`} divider/>] :
                        base;
                })
                :
                (secTypeParams=> {

                    const isSelected = this.state.selectedSecType === secTypeParams.name;
                    if (this.props.showSelectedOnly && !isSelected){
                        return null;
                    }
                    return (
                        <NavItem
                            className={isSelected ? 'active': ''}
                            eventKey={secTypeParams.name}
                            key={`NavItem-${secTypeParams.name}`}
                            onClick={()=>this.onSecTypeSelected(secTypeParams.name)}
                        >
                            {secTypeParams.name}{secTypeParams.comingSoon && comingSoon}
                        </NavItem>)
                });

        return this.props.asDropdown ?
            (
                <Nav>
                    <NavDropdown
                        onSelect={this.onSecTypeSelected}
                        id="header--sec-type"
                        title={<span><strong>{this.state.selectedSecType}</strong></span>}>
                        {flatten(this.state.selectedSecTypeOptions.map(renderSecTypeMenuItem))}
                    </NavDropdown>
                </Nav>
            )
            :
            (
                <Nav >
                    {this.state.selectedSecTypeOptions.map(renderSecTypeMenuItem)}
                </Nav>
            )
    }
}


export {SecTypeSelector};
