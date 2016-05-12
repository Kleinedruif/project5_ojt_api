var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var app = express();
//application config
var Conf = require('./conf');
//var knex = require('knex')(Conf.azure_config);

    /*knex.select('ID','Name','SessionLong').from('Users').then(function (rows) {
  console.log(rows);
}).catch(function (err) {
  console.log(err);
});*/

var routes = require('./routes/index');
var ranking = require('./routes/ranking');
var login = require('./routes/login');
var user = require('./routes/user');
var team = require('./routes/team');

//var user = require('./api/base-user-api');


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

//app.use('/api', require('./api-manifest'));

app.use('/user', user);
app.use('/', routes);
app.use('/ranking', ranking);
app.use('/team', team);

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
