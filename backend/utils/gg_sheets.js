let Q = require("q");

let moment = require('moment');
let _ = require('lodash');

let config = require(global.__base + "/backend/config.js"),
    Consts = require(global.__base + "/backend/utils/consts"),
    SbUtils = require(global.__base + "/backend/utils/SbUtils"),
    DbUtils = require(global.__base + "/backend/utils/db_utils");

const {google} = require('googleapis');

class SheetsApiMgr{
    constructor(){
        this.apiInitialized = false;

        this.SHEETS = {
            GOV_HOLDINGS_DATA: {spreadsheetId: '1Ow6L1J1tGeBikuQwB5XMk5gdMvs06M3klebN1TRclF0', sheetRangeA1Notation: "'gov totals'"},

            FOREIGN_MUTUAL_FUNDS_INST_HOLDINGS: {spreadsheetId: '1_M4rPjwN-oPmtzyTuy59USBHIeCO2PLgLHaEyvsaXWU', sheetRangeA1Notation: "'Holdings-Kupot'!Q:AF"},
            FOREIGN_ETF_INST_HOLDINGS: {spreadsheetId: '1oX7NO7Q7lzPgU7V-hjDpppvPdgb1cpte96EMadT1fFI', sheetRangeA1Notation: "'Holdings-Kupot'!Q:AH"},
            FOREIGN_ETF_MUTUAL_FUNDS_HOLDINGS: {spreadsheetId: '1oX7NO7Q7lzPgU7V-hjDpppvPdgb1cpte96EMadT1fFI', sheetRangeA1Notation: "'Holdings-Kranot'!AF:AW"},
        }
        this.SheetsAPI = null;
    }

    async _getSheetsAPI(){
        if (this.SheetsAPI === null){
            this.jwtClient = new google.auth.JWT(
                config.ggServiceAccountKey.client_email,
                null,
                config.ggServiceAccountKey.private_key,
                ['https://www.googleapis.com/auth/spreadsheets.readonly',
                    'https://www.googleapis.com/auth/drive.readonly']);
            //authenticate request
            const res = await this.jwtClient.authorize();
            // console.log("auth", res)

            this.SheetsAPI = google.sheets({version: 'v4', auth: this.jwtClient});
        }

        return this.SheetsAPI;
    }

    _error(err){
        console.log('ERROR SheetsApiMgr', err);
    }

    async readGovTotals(){
        console.log("readGovTotals from gg");
        return this.read(this.SHEETS.GOV_HOLDINGS_DATA);
    }

    async readForeignMutualFundsInstHoldings(){
        console.log("readForeignMutualFundsInstHoldings from gg");
        return this.read(this.SHEETS.FOREIGN_MUTUAL_FUNDS_INST_HOLDINGS);
    }

    async readForeignEtfMutualFundsHoldings(){
        console.log("readForeignEtfMutualFundsHoldings from gg");
        return this.read(this.SHEETS.FOREIGN_ETF_MUTUAL_FUNDS_HOLDINGS);
    }

    async readForeignEtfInstsHoldings(){
        console.log("readForeignEtfInstsHoldings from gg");
        return this.read(this.SHEETS.FOREIGN_ETF_INST_HOLDINGS);
    }

    async read({spreadsheetId, sheetRangeA1Notation}){
        // this._getSheetsAPI()
        const api = await this._getSheetsAPI();
        const result = await api.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: sheetRangeA1Notation
        }).catch(this._error);

        const data = result && result.data;
        if (!data){
            console.log('ERROR failed to retrieve data');
            return;
        }

        // console.log('data', _.keys(data));
        return data;
    }

}

module.exports = new SheetsApiMgr();
