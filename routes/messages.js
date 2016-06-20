var express = require('express');
var request = require('request');
var router = express.Router();
var uuid = require('node-uuid');
var auth = require('../modules/auth');

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
        var query = db('user as u1').select('u1.*', 'u2.deviceToken as receiver_token')
            .innerJoin('user_has_role as uhr1', 'u1.guid', 'uhr1.user_guid')
            .innerJoin('role_can_send_to as rcst', 'uhr1.role_guid', 'rcst.role_guid_from')
            .innerJoin('user_has_role as uhr2', 'rcst.role_guid_to', 'uhr2.user_guid')
            .innerJoin('user as u2', 'rcst.role_guid_to', 'u2.guid')
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
        // Only send push notifications to users with a device token
        if(allowed[0].deviceToken) {
            var deviceTokens = [];
            deviceTokens[0] = allowed[0].receiver_token;
            
            pushNotifications(deviceTokens);
        }
        
        // Only send messages with role 'ouder' to webserver
        if (allowed[0].name == 'ouder' || req.role == 'ouder'){

			// Emit to all sockets the newly received message, to webserver knows were to send it to based on the receiver_guid
            io.sockets.send({ receiver_guid: req.body.receiverId, sender_guid: req.body.senderId, body: req.body.body });
        }
        
        return res.status(200).json(inserts);//user.toObject({ virtuals: true }));
    }).catch(function (error) {
        return res.status(400).json(error);
    });
}

// Accepts an array of device tokens and pushes a notification to the devices
function pushNotifications(deviceTokens) {
    // Ionic Push Notifications url
    var url = 'https://api.ionic.io/push/notifications';
    
    // Your Ionic Authorization token
    var jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOGUwMjNiNC0xN2Y0LTQ3ZGItOGM1NS01YWY4MGE4NDkyODYifQ.qmIs8oRBJ2rag5DJsMykn2GA7dGn_BqqAto4rqyfg_E';
    
    // Your Ionic security profile
    var profile = 'toursecurity';
    
    // Json body
    var request_data = {
            "tokens": deviceTokens,
            "profile": profile,
            "notification": {
                "message": "U heeft een nieuw bericht ontvangen",
            }
    };
    
    // Fire ionic push request!
    request({
        url: url,
        method: "POST",
        json: true,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + jwt
        },
        body: request_data
     }, function (error, response, body) {
        if (!error && response.statusCode == 201) {
            console.log("Ionic Push: Push success", response);
            console.log("Statuscode: "+response.statusCode);
        }
        else {
            console.log("Ionic Push: Push error", error);
            console.log("Statuscode: "+response.statusCode);
        }
    });
}