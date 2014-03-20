
import React, { Component } from 'react';
import {get} from 'lodash'

import './misc.css';

import {sbApi} from "services/sb-api";

class Misc extends Component {
    state = {

    }

    isSBAdm(){
        return get(this.props, 'user.sbadm')
    }

    constructor(props){
        super(props);

        this.refreshForeignHoldings = this.refreshForeignHoldings.bind(this);
        this.refreshGovHoldings = this.refreshGovHoldings.bind(this);
    }

    componentWillMount(){
    }

    refreshForeignHoldings(){
        sbApi.startMigration('refreshForeignHoldings');
    }

    refreshGovHoldings(){
        sbApi.startMigration('refreshGovHoldings');
    }

    render(){
        if (!this.isSBAdm()){
            return (<div>unauthorized</div>)
        }

        return (
            <div className="container">
                <div className="text-center">
                    <h1>Misc admin - USE WITH CARE</h1>
                </div>
                <div className="misc-container">
                    <button onClick={this.refreshForeignHoldings}>refreshForeignHoldings</button>
                    <button onClick={this.refreshGovHoldings}>refreshGovHoldings</button>
                </div>

            </div>)
    }
}

export {Misc};
