
import React, { Component } from 'react';
import {isFunction} from 'lodash'

import './login.css';

import Button from 'react-bootstrap/lib/Button'

import {sbApi} from "services/sb-api";

import loginAvatarImg from './login-avatar.png'

class Login extends Component {
    state = {
        username: '',
        password: '',
        loginError: null
    }

    constructor(props){
        super(props);

        this.onLoginClicked = this.onLoginClicked.bind(this);
        this.onUsernameChanged = this.onUsernameChanged.bind(this);
        this.onPasswordChanged = this.onPasswordChanged.bind(this);
    }

    onUsernameChanged(event){
        this.setState({username: event.target.value, loginError:null})
    }

    onPasswordChanged(event){
        this.setState({password: event.target.value, loginError:null})
    }

    async onLoginClicked(e){
        e.preventDefault();

        const {username, password} = this.state;
        const loginResp = await sbApi.login({username, password});
        if (loginResp && loginResp.user){
            if (isFunction(this.props.loginCompletedCB)){
                this.props.loginCompletedCB(loginResp);
            }
        }else{
            this.setState({loginError: 'invalid user or password'});
        }
        
    }

    render(){
        const {loginError} = this.state;

        return <div className="container">
            <div className="row text-center">
                <h1>
                    SmartBull Insights
                </h1>
                <h3>
                    Financial Markets Intelligence
                </h3>
            </div>
            <div className="login-container">
                <img className="avatar" src={loginAvatarImg} alt={'avatar'}/>
                <div className="form-box">
                    <form action="/login" method="POST" onSubmit={this.onLoginClicked}>
                        <input name="username" type="text" placeholder="username"
                               value={this.state.username} onChange={this.onUsernameChanged}/>
                        <input name="password" type="password" placeholder="password"
                               value={this.state.password} onChange={this.onPasswordChanged}/>

                           {loginError && (<p className="text-danger">{loginError}</p>) }

                        {/*<input className="input-tz" type="hidden" name="tz" value="Asia/Jerusalem">*/}
                        <button className="btn btn-info btn-block login" type="submit" >
                            <span className="glyphicon glyphicon-lock" aria-hidden="true"></span> Login
                        </button>
                    </form>

                    <div id='signup-container' className=''>
                        <span>New to SmartBull?</span>
                        <div className="">
                        <Button className="btn btn-default btn-block login"
                            id='signup-btn'
                            href="https://goo.gl/forms/ePAPaGQ6KJIRWXAu1"
                            target="blank">
                            Create your SmartBull account
                        </Button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    }
}

export {Login};
