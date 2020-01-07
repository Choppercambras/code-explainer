console.log('Loading Server ...');

// Load core modules
const express = require('express');

// Load express middleware
const compression = require('compression');
const logger = require('morgan');
const favicon = require('serve-favicon');
const path = require('path');
const bodyParser = require('body-parser');

let app = express();
app.use(express.static(`${__dirname}/web`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing 
app.use(compression());
// app.use(logger("short"));

//use the middleware
// app.use(logger('dev'));


// app.use(favicon(`${__dirname}/web/img/favicon.ico`))

// Routes
let pages = require('./pages');
let api = require('./api');

app.use('/api', api);
app.use('/', pages);

// Start the server
if (!process.env.PORT) { process.env.PORT = 8080 }
if (!process.env.IP) { process.env.IP = "0.0.0.0" }
app.set('port', (process.env.PORT || 8080 ))
const server = app.listen(app.get('port'), process.env.IP, 511, function() {
  console.log(`Server listening on port ${process.env.IP}:${process.env.PORT}`);
});

// Server close functions
function gracefulShutdown() {
  console.log();
  console.log('Starting Shutdown ...');
  server.close(function() {
    console.log('Shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);

process.on('SIGINT', gracefulShutdown);