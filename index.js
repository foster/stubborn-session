//
// stubborn-session
// replacement for express-session
// - lets the db assign an id.
// - only saves sessions with changes.

var _ = require('lodash'),
    httpUtil = require('./lib/http-util');

module.exports = function stubbornSession (options) {
    var options = options || {},
        cookieName = options.key || options.name || 'sid',
        secret = options.secret,
        load = options.load,
        save = options.save;

    ///
    /// express middleware to inspect cookies for an existing session
    /// if one does not exist, creates a new session.
    /// either way, assigns the session object to req.session.
    ///
    var exports = function sessionMiddleware (req, res, next) {
        exports.load(req, function (err, session) {
            if (err) return next(err);

            // no matter what, req.session gets initialized.
            req.session = session ? session : new Session();

            req.session.save = __save.bind(req.session, req, res);
            next();
        });
    }

    ///
    /// parse the request for a session.
    /// calls the callback with the result,
    /// or null if no sessions are found.
    ///
    exports.load = function (req, done) {
        if (typeof res === 'function') { 
            done = res;
            res = undefined;
        }

        // 1. check cookies for a sid
        var sid = httpUtil.getcookie(req, cookieName, secret);

        // if no sid, we're done.
        if (!sid) return done();

        // load the sid from the database
        load(sid, function (err, row) {
            if (err) return done(err);
            if (!row) return done();

            var s = new Session();
            _.defaults(s, row, { id: sid });
            done(null, s);
        });
    }

    return exports;

    function __save (req, res, done) {
        var session = this;

        // sessions are immutable.
        // if this session already has an id,
        // clone it and create a new one.
        if (session.id) {
            session = new Session();
            _(session).defaults(this).assign({parent_session_id: this.id});
            delete session.id;
            delete session.save;
        }
    
        // 1. serialize to database
        save(session, function (err, rSession) {
            if (err) return done(err);
            if (!rSession) return done(new Error("save() must return a session id."));

            if (rSession !== req.session) {
                if (rSession instanceof Session) {
                    req.session = rSession;
                }
                else if (rSession.id) {
                    req.session.id = rSession.id;
                }
                else {
                    req.session.id = rSession;
                }
            }

            if (!req.session.id) return done(new Error("save() must return or set a session id."));

            // 2. set cookie
            httpUtil.setcookie(res, cookieName, req.session.id, secret, options);

            // 3. call done()
            done();
        });
    }
}

module.exports.Session = Session;
function Session () {}