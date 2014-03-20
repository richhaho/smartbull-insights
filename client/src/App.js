import React, { Component } from 'react';
import {Helmet} from 'react-helmet'

import {merge, cloneDeep} from 'lodash'


import 'bootstrap/dist/css/bootstrap.css';
import 'react-select/dist/react-select.css';
import '@zippytech/react-datagrid-pro/index.css'
import './App.css';
import {HighchartUtils} from 'services/highchart-utils'
import 'services/highchart-utils.css'

import {
    BrowserRouter as Router,
    Route,
    // Link,
    // Switch,
} from 'react-router-dom'
import { withRouter } from 'react-router'

import {SBConsts} from 'services/sb-consts'
import {sbApi} from "services/sb-api";
import {foreignHoldings, ForeignHoldingsDataType} from "models/foreign_holdings";
import {govHoldings} from "models/gov_holdings";

import {SessionRecorder} from 'services/session-recorder'

import {TopTitle} from "components/top-title/top-title";
import {Header} from "components/header/header";
import {PagesNav} from "components/pages-nav/pages-nav";

import {Login} from 'scenes/login/login'

import {Market} from 'scenes/market/market'
import {Category} from "scenes/category/category";
import {Institution} from "scenes/institution/institution";
import {Security} from "scenes/security/security";
import {Eula} from "scenes/eula/eula";

import {Users} from "scenes/admin/users/users";
import {RawHoldings} from "scenes/admin/raw-holdings/raw-holdings";
import {Misc} from "scenes/admin/misc/misc";

import {withHoldingsDataListener} from 'services/with-holdings-data-listener-hoc'
import {Analytics, withAnalytics} from 'services/analytics'

const
    PagesNavWithRouter = withRouter(PagesNav),
    HeaderWithRouter = withRouter(Header),
    TopTitleWithListenerAndRouter = withHoldingsDataListener(withRouter(TopTitle))
    ;

const LOGOUT_STATE = {
    gotRawData: false,
    needLogin: true,
    user: {}
}

class App extends Component {
    state = cloneDeep(LOGOUT_STATE);

    constructor(props) {
        super(props);

        this.onLoginCompleted = this.onLoginCompleted.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.onEulaSigned = this.onEulaSigned.bind(this);
    }

    async componentWillMount() {
        Analytics.init();
        if (sbApi.isAuthenticated()){
            const
                currEulaVersion = localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.CURR_EULA_VERSION),
                userLS = localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.USER);
            if (userLS && currEulaVersion) {
                const user = JSON.parse(userLS);
                this.onInitUserDone({user, currEulaVersion});
            }
        }
    }

    async loadRawData(){
        const rawData = await sbApi.getRawData();

        if (!rawData) {
            // what to do?
            console.log("error - didn't got raw data from server....")
        }else if (rawData.needLogin) {
            this.setState({needLogin: true}) // get data failed
        }else{

            const
                foreignHoldingsDataType =
                    localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.FOREIGN_HOLDINGS_DATA_TYPE) ||
                    ForeignHoldingsDataType.MutualFund,
                activePeriod = localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.SELECTED_PERIOD)
            ;

            foreignHoldings.init(rawData.foreignHoldings, {
                colorFunc: HighchartUtils.getTrendColor,
                rawDataProcessingErrors: rawData.foreignHoldingsProcessingErrors,
                rawDataSums: rawData.foreignHoldingsSums,
                foreignHoldingsDataType,
                activePeriod
            });
            govHoldings.init(rawData.govHoldings);
            this.setState({gotRawData: true}) // get data succedded
        }
    }

    onInitUserDone({user, currEulaVersion}){
        this.setState({needLogin: false, user, currEulaVersion})
        SessionRecorder.enable(user.username);
        Analytics.setUser(user.username);
        this.loadRawData();
    }

    onLoginCompleted({user, currEulaVersion}){
        // console.log("onLoginCompleted", username);
        if (user){
            localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.CURR_EULA_VERSION, currEulaVersion);
            localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
            this.onInitUserDone({user, currEulaVersion})
        }
    }

    onLogout(){
        this.setState(LOGOUT_STATE);
        sbApi.onLogout();
        foreignHoldings.clear();
        govHoldings.clear();
        localStorage.clear();
        SessionRecorder.disable();
        Analytics.unsetUser();

    }

    onEulaSigned(){
        let user = merge(this.state.user, {isEulaSigned: true});
        this.setState(user);
        localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));

    }

    renderMainAppLayout() {
        return (
            <Router>
                <div>
                    <HeaderWithRouter user={this.state.user} onLogoutCB={this.onLogout}/>
                    <div className="container">
                        <TopTitleWithListenerAndRouter/>
                        <PagesNavWithRouter/>

                        <Route path="/category/:catName*" component={withAnalytics(withHoldingsDataListener(Category))}/>
                        <Route path="/institution/:instName*" component={withAnalytics(withHoldingsDataListener(Institution))}/>
                        <Route path="/security/:secName*" component={withAnalytics(withHoldingsDataListener(Security))}/>
                        {/*<Route path="/issuer/:issuerName*" component={withAnalytics(withHoldingsDataListener(Issuer))}/>*/}
                        <Route exact path="(/market|/)" component={withAnalytics(withHoldingsDataListener(Market))}/>

                        <Route path="/admin/users"
                               render={(props) => <Users {...props} user={this.state.user} />}
                            />
                        <Route path="/admin/misc"
                               render={(props) => <Misc {...props} user={this.state.user} />}
                        />
                    </div>
                    <div className="no-container">
                        <Route path="/admin/raw-holdings"
                               render={(props) => <RawHoldings {...props} user={this.state.user} />}
                        />
                    </div>
                </div>
            </Router>
        );
    }

    renderOuterByState(){
        const
            {gotRawData, needLogin, user} = this.state,
            needToSignEula = !user.isEulaSigned;
        // console.log('debug', {gotRawData, needLogin, needToSignEula})

        if (needLogin){
            return <Login loginCompletedCB={this.onLoginCompleted}/>
        }

        if (needToSignEula){
            return <Eula onEulaSignedCB={this.onEulaSigned} currEulaVersion={this.state.currEulaVersion}/>
        }

        if (!gotRawData){
            return <div className="loader"></div>;
        }

        if (!needLogin && !needToSignEula){
            return this.renderMainAppLayout();
        }

        console.log("error WAT", this.state)
    }

    render() {
        return (
            <div>
                <Helmet>
                    <title>Smartbull Insights</title>
                </Helmet>
                {this.renderOuterByState()}
            </div>
        )

    }
}

export default App;
