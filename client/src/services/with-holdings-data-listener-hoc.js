import React from 'react';

import {foreignHoldings} from "models/foreign_holdings";

// HOC https://reactjs.org/docs/higher-order-components.html
function withHoldingsDataListener(WrappedComponent) {
    // ...and returns another component...
    return class extends React.Component {
        constructor(props) {
            super(props);
            this.handleChange = this.handleChange.bind(this);
            this.state = {
                period: 0,
                periodType: null,
                secType: null,
            };
        }

        componentWillMount(){
            this.setState({
                secType: foreignHoldings.foreignHoldingsDataType,
                period: foreignHoldings.activePeriod,
                periodType: this.getPeriodType(foreignHoldings.activePeriod),
            });
        }

        getPeriodType(period) {
            return foreignHoldings.isQuartly(period) ? 'Q' : 'M';
        }

        componentDidMount() {
            // ... that takes care of the subscription...
            foreignHoldings.addEventListener(foreignHoldings.EVENTS.PERIOD_CHANGE, this.handleChange);
            foreignHoldings.addEventListener(foreignHoldings.EVENTS.SEC_TYPE_CHANGE, this.handleChange);
        }

        componentWillUnmount() {
            foreignHoldings.removeEventListener(foreignHoldings.EVENTS.PERIOD_CHANGE, this.handleChange);
            foreignHoldings.removeEventListener(foreignHoldings.EVENTS.SEC_TYPE_CHANGE, this.handleChange);
        }

        handleChange(event) {
            // console.log("handleChange", event)
            let {secType, period, periodType} = this.state;

            switch (event.type){
                default:
                    console.log(`error unknown ${event.type}`);
                    break;
                case foreignHoldings.EVENTS.SEC_TYPE_CHANGE:
                    secType = event.to;
                    break;
                case foreignHoldings.EVENTS.PERIOD_CHANGE:
                    period = event.to;
                    periodType = this.getPeriodType(period);
                    break;
            }

            this.setState({period, periodType, secType});
        }

        render() {
            // ... and renders the wrapped component with the fresh data!
            // Notice that we pass through any additional props
            return <WrappedComponent {...this.state} {...this.props} />;
        }
    };
}
export {withHoldingsDataListener}

