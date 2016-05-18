var express = require('express');
var router = express.Router();
var ursa = require('ursa');
var fs = require('fs');
var webserverConfig = require('../config/webserver');

module.exports = function(io) {   
    
    // Make sure the incomming sockets is from the right domain and with the right token
    io.set('authorization', function(handshake, callback){
        var domain = handshake.headers.host;
        
        var key = ursa.createPrivateKey(fs.readFileSync('./private_key.pem'));
        var clientToken = key.decrypt(handshake._query.token, 'base64', 'utf8');
        
        if (webserverConfig.webserver_domain == domain && clientToken == webserverConfig.webserver_token){
            callback(null, true);
        } else {
        return callback('Deny', false);
        }    
    })

    // socket.io events
    io.on("connection", function(socket){
        console.log('socket connected');
        socket.on('disconnect', function(){console.log('Webserver disconnected');});
    });
    
    return router;
}


