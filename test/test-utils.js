let path = require('path');
global.__base = path.dirname(__filename) + '/../';

let _ = require('lodash');
let assert = require("assert");
let fs = require("fs");
let Q = require("q");
const config = require(global.__base + 'backend/config')

let mongoose = require('mongoose');
mongoose.Promise = Q.Promise;
mongoose.connect(config.mongodb_uri);
mongoose.set('debug', true);

// https://nodejs.org/api/assert.html is not nuf, we allow more on fields res (than expected)
class TestUtils {
    static mochaAsync(fn){
        return async (done) => {
            try {
                await fn();
                done();
            } catch (err) {
                done(err);
            }
        };
    };

    static clearDB(){
        return Q.all(mongoose.modelNames().map((modelName)=>{return mongoose.model(modelName).remove({}).exec()}));
    }

    static clearDBBeforeEach(done){
        return TestUtils.clearDB().then(() => {
            return done()
        });
    }

    static assertEqual(expected, res, location){
        var self= this;
        if (_.isUndefined(location)) location = '';
        assert.equal(typeof expected, typeof res, location + ': typeof mismatch');
        if (_.isNaN(expected) && _.isNaN(res)) {
            // its ok
        } else if (_.isObject(expected)){
            self.assertObjectsEqual(expected, res, location);
        }else if (_.isArray(expected)){
            self.assertArraysEqual(expected, res, location);
        }else{
            assert.equal(expected, res, location + ": not equal-> '" + expected +
                "' vs '" + res + "'");
        }
    }
    static assertObjectsEqual(expected, res, location) {
        var self= this;
        _.forEach(expected, function(val, key) {
            self.assertEqual(val, res[key], location + '/' + key);
        })
    }

    static assertArraysEqual(expected, res, location) {
        var self= this;
        _.forEach(expected, function(val, index) {
            self.assertEqual(expected, val, location + '[' + index + ']');
        })
    }



}

module.exports = TestUtils;

