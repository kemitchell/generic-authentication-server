var handler = require('..');
var http = require('http');
var levelup = require('levelup');
var memdown = require('memdown');

module.exports = function(callback) {
  var server = http.createServer(handler(levelup('/', {db: memdown})));
  server.listen(0, function() {
    callback(server, function() {
      server.close();
    });
  });
};
