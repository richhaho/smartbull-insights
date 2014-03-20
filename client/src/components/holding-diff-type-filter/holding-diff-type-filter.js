import React, { Component } from 'react';

import {isFunction} from 'lodash'
import './holding-diff-type-filter.css'

import ButtonGroup from 'react-bootstrap/lib/ButtonGroup'
import Button from 'react-bootstrap/lib/Button'

const HoldingDiffTypeFilterTypes = {
    all: 'all',
    bought: 'bought',
    sold: 'sold',
}

class HoldingDiffTypeFilter extends Component {
    state = {
        btnActive: HoldingDiffTypeFilterTypes.all
    }

    constructor(props) {
        super(props);

        this.onFilterBtnClicked = this.onFilterBtnClicked.bind(this);

    }

    onFilterBtnClicked(e){
        const btnActive= e.target.name;
        this.setState({btnActive});
        if (isFunction(this.props.onChange)){
            this.props.onChange(btnActive);
        }
    }


    render(){
        return (
            <ButtonGroup className="">
                {[
                    {name: HoldingDiffTypeFilterTypes.all, text: 'All', bsStyle: 'default'},
                    {name: HoldingDiffTypeFilterTypes.bought, text: 'Bought', bsStyle: 'success'},
                    {name: HoldingDiffTypeFilterTypes.sold, text: 'Sold', bsStyle: 'danger'},
                ].map(btnDef =>
                    <Button
                        onClick={this.onFilterBtnClicked}
                        bsStyle={btnDef.bsStyle} name={btnDef.name}
                        active={this.state.btnActive === btnDef.name}
                        key={btnDef.name}
                    >{btnDef.text}</Button>
                )}
            </ButtonGroup>
        )
    }
}


export {HoldingDiffTypeFilter, HoldingDiffTypeFilterTypes};
