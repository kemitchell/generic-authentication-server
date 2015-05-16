var ndjson = require('ndjson');
var password = require('bcrypt-password');
var through2 = require('through2');

var OK = null;

var hasString = function(argument, key) {
  var value = argument[key];
  return (
    argument.hasOwnProperty('name') &&
    typeof value === 'string' &&
    value.length > 3 &&
    !/^\s/.test(value) &&
    !/\s$/.test(value) &&
    /^[A-Za-z0-9-_]+$/.test(value)
  );
};

var hasCredentials = function(argument) {
  return (
    hasString(argument, 'name') &&
    hasString(argument, 'password')
  );
};

module.exports = function(level) {
  return function(request, response) {
    response.setHeader('content-type', 'application/x-ndjson');
    request
      .pipe(ndjson.parse())
      .pipe(through2.obj(function(object, encoding, callback) {
        if (hasCredentials(object)) {
          var action = object.action;
          if (action === 'update') {
            password.hash(object.password, function(error, digest) {
              if (error) {
                callback(OK, [error.message]);
              } else {
                level.put(
                  object.name,
                  JSON.stringify({password: digest}),
                  function(error) {
                    if (error) {
                      callback(OK, [error.message]);
                    } else {
                      callback(OK, [OK, true]);
                    }
                  }
                );
              }
            });
          } else if (action === 'authenticate') {
            level.get(object.name, function(error, data) {
              if (error) {
                callback(OK, [error.message]);
              } else {
                password.check(
                  object.password,
                  JSON.parse(data).password,
                  function(error, match) {
                    if (error) {
                      callback(OK, [error.message]);
                    } else {
                      callback(OK, [OK, match]);
                    }
                  }
                );
              }
            });
          } else {
            callback(OK, ['Invalid action']);
          }
        } else {
          callback(OK, ['Invalid action']);
        }
      }))
      .pipe(ndjson.stringify())
      .pipe(response);
  };
};
