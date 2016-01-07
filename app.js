
/**
 * Module dependencies
 */

var express = require('express'),
  busboy = require('connect-busboy'),
  methodOverride = require('method-override'),
  morgan = require('morgan'),
  api = require('./api'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();


/**
 * Configuration
 */

// All environments
app.set('port', process.env.PORT || 3000);
app.use(morgan('dev'));
app.use(busboy());
app.use(methodOverride());

var env = process.env.NODE_ENV || 'development';

// Development only
if (env === 'development') {
  // TODO
}

// Production only
if (env === 'production') {
  // TODO
}


/**
 * Routes
 */

// JSON API
app.post('/api/upload/:uid', api.upload);

app.get('/api/job/:uid', api.job);
app.get('/api/jobs/:n', api.jobs);
app.get('/api/classifier/:filename', api.job);

// Static files in public are routed to "/"
app.use(express.static(path.join(__dirname, 'public')));

// The 404 route.
// KEEP THIS AS THE LAST ROUTE
app.get('*', function(req, res){
  res.status(404);

  if (req.accepts('html')) {
    res.sendfile(__dirname + '/public/40x.html');
    return;
  }

  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  res.type('txt').send('Not found');
});


/**
 * Start server
 */

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
