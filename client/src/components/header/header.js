import React, { Component } from 'react';
import {
    NavLink,
} from 'react-router-dom'
import { withRouter } from 'react-router'

import logo from './logo.png';
import './header.css'

import Navbar from 'react-bootstrap/lib/Navbar';
import Nav from 'react-bootstrap/lib/Nav'
import MenuItem from 'react-bootstrap/lib/MenuItem'
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

import {Desktop, Tablet, Mobile} from 'services/responsive'

import {Eula} from "scenes/eula/eula";
import {Search} from 'components/search/search'
import {SecTypeSelector} from 'components/sec-type-selector/sec-type-selector';
import {withHoldingsDataListener} from 'services/with-holdings-data-listener-hoc'

const SearchWithRouterWithListener =withHoldingsDataListener(withRouter(Search));


class Header extends Component {
    state = {
        showEula: false,
        searchIsFocused: false,
    }

    constructor(props){
        super(props);

        this.showEula = this.showEula.bind(this);
        this.onCloseEula = this.onCloseEula.bind(this);
        this.onSearchFocus = this.onSearchFocus.bind(this);
    }

    showEula(){
        this.setState({showEula: true});
    }

    onCloseEula(){
        this.setState({showEula: false});
    }

    onSearchFocus(searchIsFocused){
        this.setState({searchIsFocused})
    }

    renderLogo() {
        return <Navbar.Brand>
            <NavLink exact id="logo-container" to="/market/">
                <img src={logo} alt={'Smartbull Insights logo'}/>
            </NavLink>
        </Navbar.Brand>;
    }

    renderUserDropdown(user) {
        return (
            <NavDropdown
                id="header--user"
                title={
                    <span>
                        <span className="glyphicon glyphicon-user" aria-hidden="true"></span>
                        {user.sbadm && <span className="glyphicon glyphicon-cog" aria-hidden="true"></span>}
                    </span>
                }
            >
                <Tablet>
                    {matches=>{
                        return (matches ?
                            <MenuItem disabled>{user.username}</MenuItem> :
                            null
                        )
                    }}
                </Tablet>
                <MenuItem header>{user.username}</MenuItem>
                <MenuItem onClick={this.showEula}>Terms of Service</MenuItem>
                <MenuItem
                    onClick={() => this.props.onLogoutCB()}>
                    <span className="glyphicon glyphicon-log-out"/>
                    Logout
                </MenuItem>

                {user.sbadm &&

                <NavDropdown
                    id="header--admin"
                    title={<span><span className="glyphicon glyphicon-cog" aria-hidden="true"></span>
                                    Admin Menu</span>}>
                    <MenuItem
                        componentClass={NavLink}
                        exact
                        href="/admin/users" to="/admin/users"
                    >Users</MenuItem>

                    <MenuItem
                        componentClass={NavLink}
                        exact
                        href="/admin/raw-holdings" to="/admin/raw-holdings"
                    >Holdings Raw</MenuItem>

                    <MenuItem
                        componentClass={NavLink}
                        exact
                        href="/admin/misc" to="/admin/misc"
                    >Misc</MenuItem>
                </NavDropdown>
                }

            </NavDropdown>);
    }

    renderEula(){
        return (
            <Modal show={true} onHide={this.onCloseEula}
                   bsSize="large">
                <Modal.Header closeButton/>
                <Modal.Body>
                    <Eula readonly={true}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.onCloseEula}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }

    render(){
        if (this.state.showEula){
            return this.renderEula();
        }

        const {user} = this.props;

        const searchAndUserMenu = ((isDesktop, isMobile)=> {
            const
                searchStyle = ((isDesktop, isMobile)=>{
                    if (this.state.searchIsFocused){
                        return {width: '50%'};
                    }
                    return {}
                })(),
                res = [
                    <Nav key='header-search-nav' className='search-nav-container' pullRight
                         style={searchStyle}
                    >
                        <SearchWithRouterWithListener
                            onBlur={() => this.onSearchFocus(false)}
                            onFocus={() => this.onSearchFocus(true)}
                        />
                    </Nav>,

                    <Nav key={'header-user-nav'} pullRight>                            
                        {this.renderUserDropdown(user)}
                    </Nav>
                ]

            return isMobile ? res : res.reverse();
        });
        
        return (
            <Desktop>
                {isDesktop=>(
                    <Mobile>
                        {
                            isMobile=>(
                                <header className="App-header">
                                    <Navbar inverse={!user.sbadm}>
                                        <Navbar.Header>
                                            {this.renderLogo()}
                                            <Navbar.Toggle/>
                                        </Navbar.Header>
                                        <Navbar.Collapse>
                                            <SecTypeSelector
                                                user={user}
                                                asDropdown={!isDesktop}
                                                showSelectedOnly={this.state.searchIsFocused}/>

                                            {searchAndUserMenu(isDesktop, isMobile)}
                                        </Navbar.Collapse>
                                    </Navbar>
                                </header>
                            )                        }
                    </Mobile>
                )}
            </Desktop>
        )
    }

}







export {Header};
