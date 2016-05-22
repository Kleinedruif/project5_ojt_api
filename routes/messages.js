var express = require('express');
var uuid = require('node-uuid');
var RouteAuth = require('../util/application-auth/route-auth');
var authenticate = require('../util/authMiddelware');
var router = express.Router();

/* GET home page. */
router.get('/',/* authenticate, */ function(req, res, next) {   
 
  
 
});

router.post('/:id', /*authenticate, */ function(req, res){
   var db = req.app.locals.db;
  
  // The person who sends the message
  // var sendFrom = req.user.id //or something like that
  var sendFrom = '1';
  
  //var sendTo = req.params.id;
  //TODO: get the user corresponding to this email
  
  var sendTo = '4';
  
  var id = uuid.v4();  
  var date = new Date();
  var messageTitle = req.body.title;
  var messageBody = req.body.body;
  
  if(!messageBody || !messageTitle || !sendTo){
    return res.json({ error: "Please fill in everything." });
  } 
  
   
  db('message').insert({
    guid: id,
    sender_guid: sendFrom,
    receiver_guid: sendTo,
    title: messageTitle,
    date: date,
    body: messageBody   
     
  }).then(function(inserts){
    console.log('second insert:');
    console.log();
    console.log(inserts);
  }).catch(function(error){
    console.log(error);
  });
   /*
  db('message_user').insert({
    'receiver_guid': sendTo,
    'message_guid': id,
    status: 'unread'
    
  }).then(function(inserts){
    console.log('first insert:');
    console.log();
    console.log(inserts);
  })
  */
 
  
  
  
  
  
});



router.get('/:id', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  var query = db('team').where({'guid': req.params.id});
  
  if(req.query.status) {
      query.where('status', req.query.status);
  }
  
  query.then(function(user) {
    
    var pers = user[0];
   
    res.json(pers);
    
  });
  
});


module.exports = router;
