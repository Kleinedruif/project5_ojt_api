var express 	= require('express');
var apiManifest	= express.Router();

apiManifest.use('/user', require('./api/base-user-api'));

module.exports = apiManifest;