var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var socket_io = require('socket.io');
var nodeRSA = require('node-rsa');

var app = express();

// Socket.io
var io = socket_io();
app.io = io;

var routes = require('./routes/index')(io);

//application config
var Conf = require('./conf');
//var knex = require('knex')(Conf.azure_config);

    /*knex.select('ID','Name','SessionLong').from('Users').then(function (rows) {
  console.log(rows);
}).catch(function (err) {
  console.log(err);
});*/


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var socket_client_private_key = '-----BEGIN RSA PRIVATE KEY-----MIICWwIBAAKBgHh98Cf+1FvtAJUOe8bvhDRmgsla72QH8j2jBzQC7T6UpBy6GGdq44rbJoHDjN8X2aMBBDalloUs8TsbV7P1jDdbEK6R8mrMdShASf8J5bu1BSTjnem/zeepni2dv2+DVYN4yBJjmqddWcFGhY5k0Bp4ZuDu7ZYSf8uj7psgbFR1AgMBAAECgYBkR+xoXR5Ao6+oXrWFjDJrqiWPj69NgY+K3PRRxV3Oh8dOYVOOPtfB6ULTHP1Rb3giweXP1WDA1favSsJjdCmNd/Lxwf2da6Zgg5/GGCGNxUqYKxA3mZWSPr6wHeArD811oA3JCg01tN+N0e/ZZwKnxR4crGgdJlaifqxMD7ZEAQJBAOq5OJ0ljJ3om2i+qus+917WMLtLTzAZZ4YIJSi9uEkYbOMEaWMWOhzz6J+iHmBsAheHmzvPhyd+Im3W3UvcwZECQQCDafa4uhjJrZwwh+dYNrJujNW3o+tknRcirjgVaLRfvw2CmVa8YGHTyQjbKmyuRnA0FnV8bPBJTve8cafFYXKlAkALlhcAUtEtHkVFl1vSfuoxCTugkygWhLqCeDZ1W2AUY5tEXXxiQr+dnECYWKVNNyenR69W9XiDb4t9hoSn8P6xAkAet6sjHOTkZ39l3K6X8RkePC9MoLVKLGoXAjA72OCorMjkqSEcIU9cqNY4HJ+Q0QgzNLi7n98+04WW994mhhO9AkEAqRatRy9qNbHRY+3Mbbw28RF1mvK7023On/LBgDmrJmBUj8v4KnuibYRkgGdk6jkVcAwZpcor0bPqcUVYDjIOLA==-----END RSA PRIVATE KEY-----';
var socket_client_token = 'a;wudbiuabwdlhbailucbvepsy9p483nfoushfb;jabyldlf3yb2hfbalskyfauvflhaslfyu372g';
var myDomain = 'localhost:3000';

// Make sure the incomming sockets is from the right domain and with the right token
app.io.set('authorization', function(handshake, callback){
    var domain = handshake.headers.host; //.replace('http://','').replace('https://','').split(/[/?#]/)[0];
    
    var key = new nodeRSA(socket_client_private_key);
    var clientToken = key.decryptPublic(handshake._query.token).toString('utf8');
    
    if (myDomain == domain && clientToken == socket_client_token){
        callback(null, true);
    } else {
       return callback('Deny', false);
    }
     
})

// socket.io events
app.io.on("connection", function(socket){
    console.log('socket connected');
    socket.on('disconnect', function(){console.log('Webserver disconnected');});
});

app.use('/api', require('./api-manifest'));
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
