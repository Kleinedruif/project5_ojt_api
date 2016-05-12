var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  var query = db('team');
  
  if(req.query.status) {
      query.where('status', req.query.status);
  }
  
  query.then(function(user) {
    
    res.json(user);
    
  });
});

router.get('/:id', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  var query = db('team').where({'guid': req.params.id});
  
  if(req.query.status) {
      query.where('status', req.query.status);
  }
  
  query.then(function(team) {
       
    res.json(team[0]);
    
  });
  
});

router.get('/:id/participants', function(req, res, next) {
   
   var db = req.app.locals.db;
  
  var query = db('user').where({'team_guid': req.params.id});
  
  if(req.query.status) {
      query.where('status', req.query.status);
  }
  
  query.then(function(users) {
       
    res.json(users);
    
  });
    
});

module.exports = router;
