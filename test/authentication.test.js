var http = require('http');
var ndjson = require('ndjson');
var tap = require('tap');
var withTestServer = require('./withTestServer');

var NDJSON = 'application/x-ndjson';

withTestServer(function(server, callback) {
  tap.test('authentication', function(test) {
    test.plan(5);
    var inputs = [
      {action: 'update', name: 'kyle', password: 'correct'},
      {action: 'authenticate', name: 'kyle', password: 'correct'},
      {action: 'authenticate', name: 'kyle', password: 'incorrect'}
    ];
    var expectedOutputs = [
      {action: 'update', name: 'kyle', result: [null, true]},
      {action: 'authenticate', name: 'kyle', result: [null, true]},
      {action: 'authenticate', name: 'kyle', result: [null, false]}
    ];
    http.request({
      port: server.address().port,
      headers: {
        'content-type': NDJSON,
        'transfer-encoding': 'chunked'
      }
    })
      .once('response', function(response) {
        test.equals(200, response.statusCode);
        test.equals(response.headers['content-type'], NDJSON);
        response
          .pipe(ndjson.parse())
          .on('data', function(object) {
            var expected = expectedOutputs.shift();
            test.deepEqual(object, expected);
          })
          .on('end', callback);
      })
      .end(inputs.map(JSON.stringify).join('\n'));
  });
});
