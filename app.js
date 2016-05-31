var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var socket_io = require('socket.io');

var app = express();

// Socket.io
var io = socket_io();
app.io = io;

var routes = require('./routes/index');
var ranking = require('./routes/ranking');
var login = require('./routes/login');
var user = require('./routes/user');
var team = require('./routes/team');
var messages = require('./routes/messages')(app.io);
var participant = require('./routes/participant');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({
	extended: true,
	limit: 100000000 
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setup socket
var socket = require('./modules/socket')(app.io);

// Set a database (and query builder) to use globally
app.locals.db = require('./modules/database');

//app.use('/api', require('./api-manifest'));


app.use('/messages', messages); // Put this before the default /user
app.use('/user', user);
app.use('/participant', participant);
app.use('/ranking', ranking);
app.use('/team', team);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
