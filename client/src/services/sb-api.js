

import {SBConsts} from 'services/sb-consts'

const USERS_ENDPOINT = '/users'
const ADMIN_ENDPOINT = '/admin'

class SBApi {
    constructor(){
        this.authToken = null;
        this.initialized = false;
    }


    init() {
        if (!this.initialized){
            this.authToken = localStorage.getItem(SBConsts.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
            this.initialized = true;
        }
    }

    async _apiCall(url, {method, body} = {method: 'GET'}){
        this.init(); // lazy load

        try {
            let request = {
                headers : {
                    Accept : "application/json; charset=utf-8",
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify(body),
                method,
            }
            if (this.authToken){
                request.headers.Authorization = 'Bearer ' + this.authToken;
            }
            const response = await fetch(`/api${url}`, request);
            if (response.status === 401 && response.statusText === 'Unauthorized'){
                return {needLogin: true}
            }

            return await response.json();
        }catch (err) {
            return this._errorHandler(url, err)
        }

    }

    async _get(url, opts = {}){
        opts.method = 'GET';
        return this._apiCall(url, opts);
    }

    async _post(url, body, opts = {}){
        opts.method = 'POST';
        opts.body = body;
        return this._apiCall(url, opts);
    }

    async _put(url, body, opts = {}){
        opts.method = 'PUT';
        opts.body = body;
        return this._apiCall(url, opts);
    }

    async _delete(url, opts = {}){
        opts.method = 'DELETE';
        return this._apiCall(url, opts);
    }



    _errorHandler(url, err) {
        console.log(`error in fetching "${url}"`, err, err.stack)
        return null;
    }

    isAuthenticated(){
        this.init();

        return !!this.authToken;
    }

    async getRawData(){
        return await this._get('/raw-data');
    }

    async login({username, password}){
        const loginResp = await this._post('/login', {username, password});
        if (loginResp.ok !== true){
            console.log("login failed", loginResp.msg)
            return loginResp;
        }
        this.authToken = loginResp.ok && loginResp.token;
        if (!this.authToken){
            console.log("login failed, no token")
            return {ok: false, error: 'internal error 23'};
        }

        localStorage.setItem(SBConsts.LOCAL_STORAGE_KEYS.AUTH_TOKEN, this.authToken);
        let {user, currEulaVersion} = loginResp;
        return {user, currEulaVersion};
    }

    onLogout(){
        localStorage.removeItem(SBConsts.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        this.authToken = null;
    }

    async signEula({eulaVersion}){
        const resp = await this._post(`${USERS_ENDPOINT}/sign-eula`, {eulaVersion});
        return resp.ok === true;
    }

    async usersGet(){
        return await this._get(USERS_ENDPOINT);
    }

    async usersCreate({username, password}){
        return await this._post(USERS_ENDPOINT, {username, password});
    }

    async userUpdate({userId, username, password}){
        return await this._put(`${USERS_ENDPOINT}/${userId}`, {username, password});
    }

    async userDelete(userId){
        return await this._delete(`${USERS_ENDPOINT}/${userId}`);
    }

    async startMigration(migrationType){
        return await this._get(`${ADMIN_ENDPOINT}/start-migrate?migrationType=${migrationType}`);
    }
}

let sbApi = new SBApi();
export {SBApi, sbApi};
