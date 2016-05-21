var express = require('express');
var RouteAuth = require('../util/application-auth/route-auth');
var router = express.Router();

var validateTokens = function(req, res){
  if(req.get('auth_key')){
    
  }
  else{
    res.status(403).json({ error: "Forbidden" });
  } 
  
  if(req.get('api_key')){
    // TODO: Validation for api key    
    return true;
  }
  else{
    res.status(403).json({ error: "API key is missing." })
  }  
}

var authenticate = require('../util/authMiddelware');

/* GET home page. */
router.get('/', authenticate, function(req, res, next) {  
  // if(validateTokens(req, res)){
     res.json({ response: 'hoi Jelte' });
  // }
  
  var user = req.user;
  
  
  var db = req.app.locals.db;
 
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
