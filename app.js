var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var socket_io = require('socket.io');
var ursa = require('ursa');
var fs = require('fs');

var app = express();

// Socket.io
var io = socket_io();
app.io = io;

var routes = require('./routes/index')(io);

//application config
var Conf = require('./conf');

var routes = require('./routes/index');
var ranking = require('./routes/ranking');
var login = require('./routes/login');
var user = require('./routes/user');
var team = require('./routes/team');
var messages = require('./routes/messages');

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

<<<<<<< HEAD
var socket_client_token = 'a;wudbiuabwdlhbailucbvepsy9p483nfoushfb;jabyldlf3yb2hfbalskyfauvflhaslfyu372g';
var myDomain = 'localhost:3000';

// Make sure the incomming sockets is from the right domain and with the right token
app.io.set('authorization', function(handshake, callback){
    var domain = handshake.headers.host;
    
    var key = ursa.createPrivateKey(fs.readFileSync('./private_key.pem'));
    var clientToken = key.decrypt(handshake._query.token, 'base64', 'utf8');
    
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

var knex = require('knex')(
    {
        client: 'mysql',
            connection: {
                /*
                host     : '46.17.1.173',
                port     : '3306',
                user     : 'm2mtest_groepJ',
                password : 'SFKYvUleAR',
                database : 'm2mtest_groepJ',
                charset  : 'utf8'
                */
                
                host     : 'databases.aii.avans.nl',
                port     : '3306',
                user     : 'bpzee',
                password : 'Ab12345',
                database : 'bpzee_db2',
                charset  : 'utf8'
            },
            pool: {
                min: 1,
                max: 4
            },
            useNullAsDefault: true
    });

app.locals.db = knex;
=======
// Set a database (and query builder) to use globally
app.locals.db = require('./modules/database');
>>>>>>> 3ee7262219f80ac27adf89a60baafbb7a0356a75

//app.use('/api', require('./api-manifest'));

app.use('/user', user);
app.use('/', routes);
app.use('/ranking', ranking);
app.use('/team', team);
app.use('/messages', messages);

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
