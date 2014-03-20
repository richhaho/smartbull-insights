let _ = require('lodash');
let moment = require('moment-timezone');
let util = require('util');

let amqp = require('amqplib/callback_api');

let config = require(global.__base + "/backend/config.js");
let SbUtils = require(global.__base + "/backend/utils/SbUtils.js");

let ampqConnDefault; //default connection cache

class AmpqConn {
    // opts
    // connType - publisher or worker
    // workerDispatcher - function getting the msg
    constructor(opts) {
        this._amqpConn = null;
        this.pubChannel = null;
        this.offlinePubQueue = [];
        this.connectAttempt = 0;

        this.DEFAULTS= {
            exchange: '',
            routingKey: ['jobs', (SbUtils.isProduction() ? 'prod' : 'dev'), 'insights', process.env.HEROKU_APP_NAME || 'not_heroku'].join('.')
        };

        this.connType = opts.connType || 'publisher';
        if (this.connType !== 'publisher' && this.connType !== 'worker'){
            throw new Error("wrong conn type "+ this.connType);
        }
        console.log(util.format('AmpqConn initialized (not started) as %s routing %s', this.connType, this.DEFAULTS.routingKey) );
        this.workerDispatcher = opts.workerDispatcher;
    }

    static getDefaultConnection(opts){
        if (ampqConnDefault){
            return ampqConnDefault;
        }

        ampqConnDefault = new AmpqConn(opts);
        ampqConnDefault.start();
        return ampqConnDefault;
    }

    // if the connection is closed or fails to be established at all, we will reconnect
    start() {
        console.log(util.format('AmpqConn %s starting', this.connType));

        amqp.connect(config.rabbit_url + "?heartbeat=60", (err, conn)=> {
            if (err) {
                console.error(`[AMQP] [#${this.connectAttempt}]: ${err.message}`);
                this.connectAttempt += 1;
                if (this.connectAttempt > 3 && SbUtils.isDevelopment()){
                    console.error("dev mode, giving up on AMQP!")
                }else{
                    setTimeout(this.start.bind(this), this.connectAttempt * 1000);
                }
                return;
            }

            conn.on("error", (err) => {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] conn error", err.message);
                }
            });
            conn.on("close", () =>{
                console.error("[AMQP] reconnecting");
                return setTimeout(this.start.bind(this), 1000);
            });
            console.log("[AMQP] connected");
            this.connectAttempt = 0;
            this._amqpConn = conn;
            try {
                if (this.connType === 'publisher') {
                    this._startPublisher();
                } else {
                    this._startWorker();
                }
            }catch(err){
                console.log(`error in ampq start (connType: ${this.connType})`, err)
            };

        });
    }

    _startPublisher() {
        this._amqpConn.createConfirmChannel( (err, ch) => {
            if (this._closeOnErr(err)) return;
            ch.on("error", (err) =>{
                console.error("[AMQP] channel error", err.message, err.stack);
            });
            ch.on("close", () => {
                console.log("[AMQP] channel closed");
            });

            this.pubChannel = ch;
            while (true) {
                var m = this.offlinePubQueue.shift();
                if (!m) break;
                this.publish(m[0], m[1], m[2]);
            }
        });
    }

    publishObject(contentObject) {
        this.publish(new Buffer.from(JSON.stringify(contentObject)));

    }

    publish(contentBuffer) {
        try {
            this.pubChannel.publish(this.DEFAULTS.exchange, this.DEFAULTS.routingKey, contentBuffer, {persistent: true},
                (err, ok) => {
                    if (err) {
                        console.error("[AMQP] publish", err);
                        this.offlinePubQueue.push([exchange, routingKey, contentBuffer]);
                        this.pubChannel.connection.close();
                    }else{
                        console.log("[AMQP] published, size", _.size(contentBuffer));
                    }
                });
        } catch (e) {
            console.error("[AMQP] publish", e.message);
            this.offlinePubQueue.push([exchange, routingKey, contentBuffer]);
        }
    }


    // A worker that acks messages only if processed succesfully
    _startWorker() {
        this._amqpConn.createChannel( (err, ch) => {
            if (this._closeOnErr(err)) return;
            ch.on("error", (err) => {
                console.error("[AMQP] channel error", err.message, err.stack);
                this._closeOnErr(err);
            });

            ch.on("close", () => {
                console.log("[AMQP] channel closed");
            });

            let workerDispatcherWrapper = async msg=> {
                try {
                    console.log("pre workerDispatcher")
                    const jobRes = await this.workerDispatcher(msg);
                    console.log("post workerDispatcher", jobRes)
                    if (jobRes){
                        ch.ack(msg);
                    }else{
                        console.log(`rejecting msg after calling workerDispatcher"`, err.stack);
                        ch.reject(msg, false /* requeue */); //we do not allow retries for now
                    }
                } catch (err) {
                    console.log(`rejecting msg after ERROR calling workerDispatcher "${err.message}"`, err.stack);
                    ch.reject(msg, false /* requeue */); //we do not allow retries for now
                }
            }
            ch.prefetch(10);
            ch.assertQueue(this.DEFAULTS.routingKey, {durable: true}, (err, _ok) => {
                if (this._closeOnErr(err)) return;
                ch.consume(this.DEFAULTS.routingKey, workerDispatcherWrapper, {noAck: false});
                console.log("Worker is started");
            });

        });
    }


    _closeOnErr(err) {
        if (!err) return false;
        console.error("[AMQP] error", err);
        this._amqpConn.close();
        return true;
    }


}

module.exports = AmpqConn;
