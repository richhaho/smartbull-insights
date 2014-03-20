
import {SBUtils} from 'services/sb-utils'

let enabled = false;
class SessionRecorder{
    static enable(userId, retryCount=0){
        if (!SBUtils.isDev() && window.JacoRecorder){
            try{
                console.log("enabling SR", userId)
                window.JacoRecorder.identify(userId, function callback(err){
                    if (err){
                        console.log("error SR", err)
                    }else{
                        enabled = true;
                        console.log('SR registered', userId);
                    }
                })
            }catch (err){
                console.log("error enabling SR", err);

                if (retryCount < 3){
                    setTimeout(function(){
                        SessionRecorder.enable(userId, retryCount+1);
                    }, (retryCount+1) * 1000)
                }

            }
;
        }
    }

    static disable(){
        if (enabled && window.JacoRecorder){
            try{
                window.JacoRecorder.removeUserTracking();
            } catch (err){
                console.log("error disabling SR", err);
            }
        }
    }
}

export {SessionRecorder}
