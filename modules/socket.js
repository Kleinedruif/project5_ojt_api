var express = require('express');
var router = express.Router();
var ursa = require('ursa');
var fs = require('fs');
var webserverConfig = require('../config/webserver');

module.exports = function(io) {   
    
    // Make sure the incomming sockets is from the right domain and with the right token
    // This is a middleware function
    io.set('authorization', function(handshake, callback){      
        // Retrive private key
        var key = ursa.createPrivateKey(fs.readFileSync('./private_key.pem'));

        var webserver_ip = process.env.webserver_ip || webserverConfig.webserver_ip;

        console.log(handshake.connection._peername.address);
        //console.log(socket.request.connection.remoteAddress);
        //console.log(socket.request.connection._peername.address);
        
        // Descerypt incomming token
        var clientToken = key.decrypt(handshake._query.token, 'base64', 'utf8');
        
        // Check if token and domain is valid
        if (clientToken == webserverConfig.webserver_token && handshake.connection._peername.address.indexOf(webserver_ip) >= 0){
            // Set connection is true and move on to the connection part
            callback(null, true);
        } else {
            // Cancal the socket connection and return
            return callback('Deny', false);
        }    
    })

    // socket.io events
    io.on('connection', function(socket){
        console.log('Webserver connected');
        socket.on('disconnect', function(){
            console.log('Webserver disconnected');
        });
    });
    
    return router;
}


