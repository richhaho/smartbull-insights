let moment = require('moment');
let _ = require('lodash');     

let Consts = require(global.__base + "/backend/utils/consts.js");
let SbUtils = require(global.__base + "/backend/utils/SbUtils.js");

let mongoose = require('mongoose');



class DbUtils{
    static toObjectId(arg){
        if (_.isArray(arg)) {
            return _.map(arg, function(e){
                if (e._id){
                    return mongoose.Types.ObjectId(e._id);
                }else{
                    return mongoose.Types.ObjectId(e);
                }
            });
        }else if (_.isString(arg)){
            return mongoose.Types.ObjectId(arg)
        }else if (Object.getPrototypeOf(arg) === mongoose.Types.ObjectId.prototype){
            return arg;
        } else {
            // hmmm unknown. best effort:
            return mongoose.Types.ObjectId(arg)
        }
    }

    static async dropCollection(colName){
        try {
            const db = mongoose.connection;
            await db.collection(colName).drop();
        } catch (err) {
            if (err.code === 26 && err.message === 'ns not found'){
                console.log(`clear cache was not needed, collection "${colName}" didnt exist`)
            }else{
                throw err;
            }
        }
    }
};


module.exports = DbUtils;
