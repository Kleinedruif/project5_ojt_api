var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');
var RouteAuth = require('../util/application-auth/route-auth');
var authenticate = require('../util/authMiddelware');

module.exports = function(io) {
    //TODO use authenticate middleware
    //TODO make route '/'
    router.get('/:id',/* authenticate, */ function(req, res, next){
        var db = req.app.locals.db;

        var query = db('message as m').select('m.*').where('m.receiver_guid', req.params.id).orderBy('m.date','DESC'); ;

        query.then(function(messages){
            res.json(messages);
        });
    });

    //TODO use authenticate middleware
    router.post('/',/* authenticate, */ function(req, res, next){
        var db = req.app.locals.db;
        
        // Get current data in the right formate
        var d = new Date,
              dformat = [d.getMonth()+1,
               d.getDate(),
               d.getFullYear()].join('/')+' '+
              [d.getHours(),
               d.getMinutes(),
               d.getSeconds()].join(':');
        
        // Insert message   
        db('message').insert({
              guid: Math.round(new Date().getTime()/1000), 
              sender_guid: req.body.senderId, 
              receiver_guid: req.body.receiverId, 
              title: req.body.title,
              body: req.body.body,
              date: d
          })
          .then(function(inserts) {
              console.log('new message saved');
              
              // Emit to all sockets the newly recieved message, to webserver knows were to send it to based on the receiver_guid
              io.sockets.send({receiver_guid: req.body.receiverId, sender_guid: req.body.senderId, title: req.body.title, body: req.body.body});
              res.status(200).json(inserts);//user.toObject({ virtuals: true }));
          })
          .catch(function(error) {
              console.error(error);
          });        
    });
      
    return router;
}

