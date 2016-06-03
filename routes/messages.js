var express = require('express');
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

        query.then(function (messages) {
            res.json(messages);
        });
    });

    router.get('/:role/contacts', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
        var db = req.app.locals.db;

        var query = db('role as r').select('r2.*', 'rcst.broadcast', 'u.first_name', 'u.last_name', 'u.guid as userid')
            .leftJoin('role_can_send_to as rcst', 'rcst.role_guid_from', 'r.guid')
            .leftJoin('user_has_role as uhr', 'rcst.role_guid_to', 'uhr.role_guid')
            .innerJoin('role as r2', 'uhr.role_guid', 'r2.guid')
            .leftJoin('user as u', 'u.guid', 'uhr.user_guid')
            .where('r.name', req.params.role)
            .orderBy('u.first_name', 'ASC');

        query.then(function (contacts) {
            res.json(contacts);
        });
    });

    router.post('/', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
        var db = req.app.locals.db;

        // Get current data in the right formate
        var d = new Date,
            dformat = [d.getMonth() + 1,
                d.getDate(),
                d.getFullYear()].join('/') + ' ' +
                [d.getHours(),
                    d.getMinutes(),
                    d.getSeconds()].join(':');

        // Insert message   
        db('message').insert({
            guid: Math.round(new Date().getTime() / 1000),
            sender_guid: req.body.senderId,
            receiver_guid: req.body.receiverId,
            body: req.body.body,
            date: d
        })
            .then(function (inserts) {
                console.log('new message saved');

                // Emit to all sockets the newly recieved message, to webserver knows were to send it to based on the receiver_guid
                io.sockets.send({ receiver_guid: req.body.receiverId, sender_guid: req.body.senderId, body: req.body.body });
                res.status(200).json(inserts);//user.toObject({ virtuals: true }));
            })
            .catch(function (error) {
                console.error(error);
            });
    });

    return router;
}

