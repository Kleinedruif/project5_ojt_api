var express = require('express');
var http = require("http");
var https = require("https");
var router = express.Router();
var uuid = require('node-uuid');
var auth = require('../modules/auth');
// var cors = require('cors');

module.exports = function(io) {
    //TODO make route '/'
    router.get('/:id', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
        var db = req.app.locals.db;

        var query = db('message as m').select('m.*', 'u1.first_name as recFName', 'u1.last_name as recLName', 'r1.name as recRole', 'u2.first_name as sendFName', 'u2.last_name as sendLName', 'r2.name as sendRole')
            .innerJoin('user as u1', 'm.receiver_guid', 'u1.guid')
            .leftJoin('user_has_role as uhr1', 'u1.guid', 'uhr1.user_guid')
            .leftJoin('role as r1', 'uhr1.role_guid', 'r1.guid')

            .innerJoin('user as u2', 'm.sender_guid', 'u2.guid')
            .leftJoin('user_has_role as uhr2', 'u2.guid', 'uhr2.user_guid')
            .leftJoin('role as r2', 'uhr2.role_guid', 'r2.guid')

            .where('m.receiver_guid', req.params.id)
            .orWhere('m.sender_guid', req.params.id)
            .orderBy('m.date', 'ASC');

        query.then(function(messages) {
            res.json(messages);
        }).catch(function(err){
			res.status(400).json(error);
		})
    });

	// get messages with contact
	//TODO make route '/contact/:id' or '/:id'
    router.get('/:id/contact/:contactId', function(req, res, next){
        var db = req.app.locals.db;

		var offset = parseInt(req.query.offset);
		
        var query = db('message as m')
            .where('m.receiver_guid', req.params.id)
			.andWhere('m.sender_guid', req.params.contactId)
            .orWhere('m.receiver_guid', req.params.contactId)
            .andWhere('m.sender_guid', req.params.id)
            .orderBy('m.date', 'ASC')
			.offset(offset);

        query.then(function (messages) {
            return res.json(messages);
        }).catch(function(err){
			return res.status(400).json(error);
		})
    });

    router.get('/:role/contacts', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
        var db = req.app.locals.db;

        var query = db('role as r').select('r2.*', 'rcst.broadcast', 'u.first_name', 'u.last_name', 'u.guid as userid')
            .leftJoin('role_can_send_to as rcst', 'rcst.role_guid_from', 'r.guid')
            .leftJoin('user_has_role as uhr', 'rcst.role_guid_to', 'uhr.role_guid')
            .innerJoin('role as r2', 'uhr.role_guid', 'r2.guid')
            .leftJoin('user as u', 'u.guid', 'uhr.user_guid')
            .where('r.name', req.params.role)
            .orderBy('u.first_name', 'ASC')

        query.then(function (contacts) {
            return res.json(contacts);
        }).catch(function(err){
			return res.status(400).json(error);
		})
    });

    router.post('/', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
        var db = req.app.locals.db;

        // This query check if you are allowed to send from this role to the receivers role
        var query = db('user as u1')
            .innerJoin('user_has_role as uhr1', 'u1.guid', 'uhr1.user_guid')
            .innerJoin('role_can_send_to as rcst', 'uhr1.role_guid', 'rcst.role_guid_from')
            .innerJoin('user_has_role as uhr2', 'rcst.role_guid_to', 'uhr2.user_guid')
            .innerJoin('role as r', 'rcst.role_guid_to', 'r.guid')
            .where('u1.guid', req.body.senderId)
            .where('uhr2.user_guid', req.body.receiverId)
            .then(function(allowed){
                if (allowed && allowed.length){
                    sendMessage(req, res, allowed, io);
                } else {
                    return res.status(404).json({message: 'Kan dit bericht niet naar deze persoon versturen'});
                }
            })
    });

    return router;
}

function sendMessage(req, res, allowed, io){
    var db = req.app.locals.db;
    
    // Get current data in the right formate
    var d = new Date,
        dformat = [
            d.getMonth() + 1,
            d.getDate(),
            d.getFullYear()
        ].join('/') + ' ' + [
            d.getHours(),
            d.getMinutes(),
            d.getSeconds()
        ].join(':');

    // Insert message   
    db('message').insert({
        guid: Math.round(new Date().getTime() / 1000),
        sender_guid: req.body.senderId,
        receiver_guid: req.body.receiverId,
        body: req.body.body,
        date: d
    }).then(function (inserts) {                      
        // Only send messages with role 'ouder' to webserver
        if (allowed[0].name == 'ouder' || req.role == 'ouder'){
            // Get the device tokens
            db('user as u').select('u.deviceToken')
					   .innerJoin('user_has_role as uhr', 'u.guid', 'uhr.user_guid')
                       .innerJoin('role as r', 'uhr.role_guid', 'r.guid')
                       .where('u.guid', receiver)
                       .then(function(user){
                          
                           
                user = user[0];
                
                var deviceTokens = [];
                deviceTokens[0] = user.deviceToken;
                
                console.log('sending push notification');
                pushNotifications(deviceTokens);
                
            });
            
			console.log('new message saved');

			// Emit to all sockets the newly recieved message, to webserver knows were to send it to based on the receiver_guid
            io.sockets.send({ receiver_guid: req.body.receiverId, sender_guid: req.body.senderId, body: req.body.body });
        }
        return res.status(200).json(inserts);//user.toObject({ virtuals: true }));
    }).catch(function (error) {
        return res.status(400).json(error);
    });
}

// Accepts an array of device tokens and pushes a notification to the devices
function pushNotifications(deviceTokens) {
    // Define relevant info
    
    // Your Authorization token
    var jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOGUwMjNiNC0xN2Y0LTQ3ZGItOGM1NS01YWY4MGE4NDkyODYifQ.qmIs8oRBJ2rag5DJsMykn2GA7dGn_BqqAto4rqyfg_E';
    
    // var tokens = ['your', 'target', 'tokens'];
    
    // Your security profile
    var profile = 'toursecurity';

    var post_data = JSON.stringify({
            "tokens": deviceTokens,
            "profile": profile,
            "notification": {
                "title": "Nieuw bericht",
                "message": "U heeft een bericht ontvangen",
                "android": {
                    "title": "Hey",
                    "message": "Hello Android!"
                },
                "ios": {
                    "title": "Howdy",
                    "message": "Hello iOS!"
                }
            }
    });


    var post_options = {
        host: 'https://api.ionic.io',
        port: '443',
        method: 'POST',
        path: '/push/notifications',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + jwt
        }
    };

    // Set up the request
    var post_req = http.post(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

    // Build the request object
    // var req = {
    //     method: 'POST',
    //     url: 'https://api.ionic.io/push/notifications',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': 'Bearer ' + jwt
    //     },
    //     data: {
    //         "tokens": deviceTokens,
    //         "profile": profile,
    //         "notification": {
    //             "title": "Nieuw bericht",
    //             "message": "U heeft een bericht ontvangen",
    //             "android": {
    //                 "title": "Hey",
    //                 "message": "Hello Android!"
    //             },
    //             "ios": {
    //                 "title": "Howdy",
    //                 "message": "Hello iOS!"
    //             }
    //         }
    //     }
    // };

    // // Make the API call
    // http(req).success(function(resp){
    // // Handle success
    // console.log("Ionic Push: Push success", resp);
    // }).error(function(error){
    // // Handle error 
    // console.log("Ionic Push: Push error", error);
    // });
}