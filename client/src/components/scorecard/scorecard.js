import numeral from 'numeral'
import React from 'react';

import './scorecard.css'

import {SBUtils} from 'services/sb-utils'


const ScoreCardDisplayModes = {
    CURRENCY_CONDENSED: 'CURRENCY_CONDENSED',
    PEECENTAGE: 'PEECENTAGE',
}

class ScoreCard extends React.Component {
    getDisplayValue() {
        let {value, valueDisplayMode} = this.props;
        if (value !== null && value !== undefined){
            switch (valueDisplayMode) {
                case ScoreCardDisplayModes.CURRENCY_CONDENSED:
                    return SBUtils.shortNumber$Renderer(value, '$0');
                case ScoreCardDisplayModes.PEECENTAGE:
                    return numeral(value).format('0.00') + '%';
                default:
                    return value;
            }
        }

    }

    render() {
        return (
            <span
                className={'scorecard-container'}
                style={this.props.isLast ? {borderRight: 'none'} : {}}
            >
            <span className="scorecard-label">{this.props.label}</span>
            <span className={"scorecard-value " + (this.props.colorValueTrend ? SBUtils.diffToClass(this.props.value) : '')} >
                {this.getDisplayValue()}
                </span>
        </span>
        )
    }
}

export {ScoreCard, ScoreCardDisplayModes};
