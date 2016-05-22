var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');
var RouteAuth = require('../util/application-auth/route-auth');
var authenticate = require('../util/authMiddelware');

//TODO use authenticate middleware
//TODO make route '/'
router.get('/:id',/* authenticate, */ function(req, res, next){
	var db = req.app.locals.db;

	var query = db('message as m').select('m.*')
                                .where('m.receiver_guid', req.params.id);

  query.then(function(messages){
    res.json(messages);
  });
});

//TODO use authenticate middleware
router.post('/',/* authenticate, */ function(req, res){
  var db = req.app.locals.db;

  db('message').insert({
    guid: Math.round(new Date().getTime()/1000), 
    sender_guid: req.body.senderId, 
    receiver_guid: req.body.receiverId, 
    title: req.body.title,
    body: req.body.body
  })
  .then(function(inserts) {
    console.log('new message saved');
    res.status(200).json(inserts);//user.toObject({ virtuals: true }));
  })
  .catch(function(error) {
    console.error(error);
  });
});

module.exports = router;
