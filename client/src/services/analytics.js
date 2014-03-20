import React, { Component } from 'react';
import GA from 'react-ga';

import {SBUtils} from 'services/sb-utils'



class Analytics{
    static init(){
        GA.initialize('UA-114368997-1', {
            debug: SBUtils.isDev(),
            titleCase: false
        });
    }

    static setUser(userId){
        GA.set({ userId});
        GA.set({dimension1: userId});//custom dimension
    }

    static unsetUser(){
        GA.set({ userId: null});
        GA.set({dimension1: null});//custom dimension
    }

    static pageView(pageDesc){
        GA.pageview(pageDesc);

    }

    static modalView(modalDesc){
        GA.modalview(modalDesc);
    }

    static event({category, action, label, nonInteraction} = {nonInteraction: false}){
        GA.event({category, action, label, nonInteraction});
    }
}

const withAnalytics = (WrappedComponent, options = {}) => {
    const toFullUrl = location => [location.pathname, location.search].join('')
    const HOC = class extends Component {
        componentDidMount() {
            const page = toFullUrl(this.props.location);
            Analytics.pageView(page);
        }

        componentWillReceiveProps(nextProps) {
            const
                currentPage = toFullUrl(this.props.location),
                nextPage = toFullUrl(nextProps.location);

            if (currentPage !== nextPage) {
                Analytics.pageView(nextPage);
            }
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    };

    return HOC;
};


export {Analytics, withAnalytics}
