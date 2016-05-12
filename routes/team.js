var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  db('user').where({'parent_guid': null}).then(function(user) {
    
    res.json(user);
    
  });
});

router.get('/:id', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  db('team').where({'guid': req.params.id}).then(function(user) {
    
    var pers = user[0];
   
    res.json(pers);
    
  });
  
});

router.get('/:id/participants', function(req, res, next) {
   
   var db = req.app.locals.db;
  
  db('user').where({'team_guid': req.params.id}).then(function(user) {
       
    res.json(user);
    
  });
    
});

module.exports = router;
