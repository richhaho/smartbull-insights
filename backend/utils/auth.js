
// passport config
let moment = require('moment'),
    passport = require('passport'),
    passportJWT = require('passport-jwt'),
    JwtStrategy = passportJWT.Strategy,
    ExtractJwt = passportJWT.ExtractJwt;
let User = require(`${global.__base}/backend/models/user`),
    config = require(global.__base + "/backend/config.js"),
    DbUtils = require(global.__base + "/backend/utils/db_utils");

class AuthMgr{
    static hookMiddleware(app){
        app.use(passport.initialize());

        passport.use(
            new JwtStrategy({
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: config.jwt_secret,
            }, function(jwt_payload, done) {
                User.findOne({_id: DbUtils.toObjectId(jwt_payload._id)}, function(err, user) {
                    if (err) {
                        return done(err, false);
                    }
                    if (user) {
                        if (jwt_payload.jti === user.jti.toJSON()) {
                            return done(null, user);
                        }
                        console.log(`WARN jti mismacth ${user.username}`);
                    }

                    done(null, false);

                });
            })
        );
    }


    static requireAuth(app, routeUrlPath, routeSrcFile){
        app.use(
            routeUrlPath,
            passport.authenticate('jwt', { session: false}),
            require(global.__base + routeSrcFile)(routeUrlPath));
    }

}

module.exports = AuthMgr;
