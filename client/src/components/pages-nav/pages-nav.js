import {find} from 'lodash'

import React, { Component } from 'react';
import {
    NavLink,
} from 'react-router-dom'

import './pages-nav.css'

import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import NavDropdown from 'react-bootstrap/lib/NavDropdown'

import {Mobile, NotMoblie} from 'services/responsive'
// alternative solution to router v4 & bootstrap routing issue :
// import { LinkContainer } from "react-router-bootstrap";
/*
                {this.tabs.map(tab => {

                    const link = '/' + tab.toLowerCase() + '/';
                    return (
                        <LinkContainer to={link}>
                            <NavItem>{tab}</NavItem>
                        </LinkContainer>)
                })}
* */


class PagesNav extends Component {
    state = {
        selectedTab: {},
        showPagesNav: true
    }

    constructor(props){
        super(props);

        this.tabs = [
            {title: 'Market Trends', link: '/market/', eventKey:'market'},
            {title: 'Category Breakdown', link: '/category/', eventKey:'category'},
            {title: 'Institution Overview', link: '/institution/', eventKey:'institution'},
            {title: 'Fund Analysis', link: '/security/', eventKey:'security'},
            // {title: 'Issuer Analysis', link: '/issuer', eventKey:'issuer'},
        ];

        this.handleSelect = this.handleSelect.bind(this);
    }

    componentWillMount(){
        this.setSelectedTabFromRouter(this.props.location.pathname);
    }

    setSelectedTabFromRouter(routingPathName){
        if (routingPathName.startsWith('/admin')){
            this.setState({showPagesNav: false});
            return;
        }

        let selectedTab = find(this.tabs, tabParams=>{
            const links = tabParams.links || [tabParams.link];
            return !!(find(links, link=> {
                if (link === '/')
                    return routingPathName === '/'; // need to fully match
                else{
                    return routingPathName.startsWith(link)
                }
            }));
        });
        if (!selectedTab){
            console.log(`ERROR - setSelectedTabFromRouter no tab matching ${routingPathName}`)
            selectedTab = this.tabs[0];
        }
        this.setState({showPagesNav: true, selectedTab})
    }

    handleSelect(selectedEventKey){
        let selectedTab = find(this.tabs, tabParams=>tabParams.eventKey === selectedEventKey);
        if (!selectedTab){
            console.log(`ERROR - not tab with ${selectedEventKey}`)
            selectedTab = this.tabs[0];
        }
        this.setState({selectedTab})
    }

    componentWillReceiveProps(nextProps){
        this.setSelectedTabFromRouter(nextProps.location.pathname);

    }

    renderTabs(){
        return (
            this.tabs.map(tabParams=>{
                return <NavItem
                    key={'pages-nav-' + tabParams.title}
                    componentClass={NavLink}
                    href={tabParams.link} to={tabParams.link}
                    onSelect={this.handleSelect}
                    eventKey={tabParams.eventKey}
                    active={this.state.selectedTab === tabParams}>{tabParams.title}
                </NavItem>
            })
        )
    }

    render(){
        if (!this.state.showPagesNav){
            return null;
        }

        return (
            <h4>
                <Mobile>
                    <Nav bsStyle="tabs">
                        <NavDropdown eventKey="nav-dropdown-pages-nav" title={this.state.selectedTab.title || ''}
                                     id="nav-dropdown">
                            {this.renderTabs()}
                        </NavDropdown>
                    </Nav>

                </Mobile>
                <NotMoblie>
                    <Nav bsStyle="tabs" justified>
                        {this.renderTabs()}
                    </Nav>
                </NotMoblie>
            </h4>
        )
    }
}







export {PagesNav};
