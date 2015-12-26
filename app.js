
/**
 * Module dependencies
 */

var express = require('express'),
  busboy = require('connect-busboy'),
  methodOverride = require('method-override'),
  morgan = require('morgan'),
  routes = require('./routes'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(busboy());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// serve static html for v2
app.use(express.static(path.join(__dirname, 'mock')));

var env = process.env.NODE_ENV || 'development';

// development only
if (env === 'development') {
  // TODO
}

// production only
if (env === 'production') {
  // TODO
}

/**
 * WebSockets
 */

var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 8080});

var CLIENTS = [];

// TODO:
//  * Prune list of connections periodically - maybe automatically?
//  * Add WSID to wss.clients object instead!

wss.on('connection', function(ws) {
  CLIENTS.push(ws);
  ws.wsids = [];

  ws.on('message', function(message) {
    console.log('received: %s', message);

    ws.send("url: https://s3-eu-west-1.amazonaws.com/fontdetective/img/moss.jpg");

    // WSID message
    var wsid = /^wsid: (.+)$/;
    var result = message.match(wsid);
    ws.wsids.push(result[1]);
    console.log(ws.wsids);
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(ws) {
    ws.send(data);
  });
};

/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.post('/api/upload', api.upload);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
