# stubborn-session

An ignorant yet opinionated replacement for express-session.

## Motivation

stubborn-session is simple session middleware ideal for for write-once sessions.
For example, a session which is created at login and doesn't change until logout or the session expires.

Why not express-session? Well, stubborn-session provides these things:
- it allows the store to set the session id.
- it allows immutable sessions.
- sessions can be read without using the middleware, for instance on websocket connections.

## Installation

Add to your application via `npm`:
```
npm install tuxedo25/stubborn-session --save
```
This will install `stubborn-session` and add it to your application's `package.json` file.

## How to Use

To use `stubborn-session`, simply use it as express middleware:
```js
var express = require('express');
var stubbornSession = require('stubborn-session');
var app = express();
app.use(stubbornSession({
    key: 'session_cokie_name',
    secret: 'wicked secret',
    load: function (id, done) {
        var loadedSession = {};
	      // load from the db then call done
	      // or call done with no arguments
	      // to indicate no session found
	      done(null, loadedSession);
    },
    save: function (done) {
        var session = this;

        session.id = generateId();
	      // save your session to the db,
	      // then call done.
	      done(null, session);
    }
});

app.get('/', saveUserAgent, express.static('index.html'));
function saveUserAgent (req, res, next) {
  // only do this for new sessions.
  if (!req.session.id) {
      req.session.userAgent = req.headers['user-agent']
      req.session.save(function (err) {
          if (err) return next(err);
          next();
      });
  }
})
```
