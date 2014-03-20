import React from 'react';

import './scorecard.css'

import {ScoreCard, ScoreCardDisplayModes} from "./scorecard";
import {foreignHoldings} from "models/foreign_holdings";
import {SBUtils} from "services/sb-utils";

const ScoreCardsPanelCardTypes={
    ALL_HOLDINGS_SUM: 'ALL_HOLDINGS_SUM',
    ALL_HOLDINGS_CHANGE: 'ALL_HOLDINGS_CHANGE',
    ALL_HOLDINGS_CHANGE_PRECENT: 'ALL_HOLDINGS_CHANGE_PRECENT',
    TOTAL_INSTITUTIONS: 'TOTAL_INSTITUTIONS',
    TOTAL_SECURITIES: 'TOTAL_SECURITIES',
}

class ScoreCardsPanel extends React.Component {

    render() {
        const
            trendSums = foreignHoldings.getTrendSums(this.props.trendSumsDef),
            scorecardDefs = [
                {
                    label: foreignHoldings.activePeriodShortDisplayName + ' Holdings Value',
                    value: trendSums.activePeriodHoldings,
                    valueDisplayMode: ScoreCardDisplayModes.CURRENCY_CONDENSED,
                    cardType: ScoreCardsPanelCardTypes.ALL_HOLDINGS_SUM,
                },
                {
                    label: foreignHoldings.activePeriodTypeDisplayName + ' Changes Value ($)',
                    value: trendSums.diffHoldings,
                    valueDisplayMode: ScoreCardDisplayModes.CURRENCY_CONDENSED,
                    cardType: ScoreCardsPanelCardTypes.ALL_HOLDINGS_CHANGE,
                    colorValueTrend: true,
                },
                {
                    label: foreignHoldings.activePeriodTypeDisplayName + ' Changes Value (%)',
                    value: SBUtils.calcGrowthRatio(trendSums.activePeriodHoldings, trendSums.activePeriodHoldings - trendSums.diffHoldings),
                    valueDisplayMode: ScoreCardDisplayModes.PEECENTAGE,
                    cardType: ScoreCardsPanelCardTypes.ALL_HOLDINGS_CHANGE_PRECENT,
                    colorValueTrend: true,
                },
                {
                    label: 'Active Institutions',
                    value: trendSums.totalInstitutions,
                    cardType: ScoreCardsPanelCardTypes.TOTAL_INSTITUTIONS,
                },
                {
                    label: 'Active Securities',
                    value: trendSums.totalSecurities,
                    cardType: ScoreCardsPanelCardTypes.TOTAL_SECURITIES,
                },
            ]
                .filter(e=>!(this.props.hideCards || []).includes(e.cardType))
                .filter(e=>e.value !== null)
        ;

        const sz=scorecardDefs.length;
        return (
            <div className="panel panel-default">
                <div className="panel-body bg-success text-center">
                    {
                        scorecardDefs.map((scorecardDef, i) => {
                            return <ScoreCard
                                key={scorecardDef.label + i}
                                label={scorecardDef.label}
                                value={scorecardDef.value}
                                valueDisplayMode={scorecardDef.valueDisplayMode}
                                colorValueTrend={scorecardDef.colorValueTrend}
                                isLast={i===sz-1}
                            />
                        })
                    }
                </div>
            </div>
        );
    }
}


export {ScoreCardsPanel, ScoreCardsPanelCardTypes};
