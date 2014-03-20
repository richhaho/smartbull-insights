
import React, { Component } from 'react';
import {get, some} from 'lodash'

import './users.css';

import DataGrid from '@zippytech/react-datagrid-pro'

import {sbApi} from "services/sb-api";

class Users extends Component {
    state = {
        users: [],
        newUser:{
            username: '',
            password: ''
        },
        alertMsg: ''
    }

    constructor(props){
        super(props);
        this.onNewUserSubmit = this.onNewUserSubmit.bind(this);
        this.onNewUserUserNameChange = this.onNewUserUserNameChange.bind(this);
        this.onNewUserPasswordChange = this.onNewUserPasswordChange.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    async componentWillMount(){
        if (this.isSBAdm()){
            const users = await sbApi.usersGet();
            this.setState({users});
        }
    }

    alert(msg){
        this.setState({alertMsg: msg});
    }

    async onNewUserSubmit(event) {
        // alert('A name was submitted: ' + this.state.value);
        event.preventDefault();

        const {newUser} = this.state;
        if (newUser.username.trim().length < 3){
            this.alert('need longer username');
            return;
        }

        if (newUser.password.trim().length < 6){
            this.alert('need longer password');
            return;
        }

        const resp = await sbApi.usersCreate(newUser);
        if (resp.ok === true) {
            const users = this.state.users.concat(resp.newUser);
            this.setState({users});
            this.alert('');
        }else{
            this.alert('failed to create user - ' + resp.error);
        }

    }

    onNewUserUserNameChange(event){
        let {newUser} = this.state;
        newUser.username = event.target.value;
        this.setState({newUser});
    }
    
    onNewUserPasswordChange(event){
        let {newUser} = this.state;
        newUser.password = event.target.value;
        this.setState({newUser});
    }

    isSBAdm(){
        return get(this.props, 'user.sbadm')
    }

    async deleteUser(user){
        const resp = await sbApi.userDelete(user._id);
        if (resp.ok){
            const users = this.state.users.filter(u=>u._id !== user._id)
            this.setState({users});
        }
    }

    renderUsers(){
        const
            columns = [
                {name: '_id'},
                {name: 'username'},
                {name: 'eula_date'},
                {name: 'eula_version'},
                {name: 'isEulaSigned', header: 'signed EULA',
                    render: ({ value }) => value ? '√' : 'X' },
                {name: 'Delete!', flex: 0.3,
                    render: ({data})=>{
                        return (
                            <button onClick={()=>this.deleteUser(data)}>X</button>
                        )
                    }
                }
            ].map(col=>{col.flex= col.flex || 1; return col;}),
            dataSource = this.state.users;

        return (
            <DataGrid
                idProperty={'name'}
                columns={columns}
                dataSource={dataSource}
            />
        )
    }

    render(){
        if (!this.isSBAdm()){
            return (<div>unauthorized</div>)
        }

        return (
            <div className="container">
                <div className="text-center">
                    <h1>Users admin</h1>
                </div>
                <div className="users-container">
                    {this.renderUsers()}

                    {some(this.state.alertMsg) && <span className='text-danger'>{this.state.alertMsg}</span>}
                    <form onSubmit={this.onNewUserSubmit}>
                        <label>
                            Name:
                            <input type="text" value={this.state.newUser.username}
                                   onChange={this.onNewUserUserNameChange} />
                        </label>
                        <label>
                            Password:
                            <input type="text" value={this.state.newUser.password}
                                   onChange={this.onNewUserPasswordChange} />
                        </label>
                        <input type="submit" value="Create New" />
                    </form>
                </div>

            </div>)
    }
}

export {Users};
