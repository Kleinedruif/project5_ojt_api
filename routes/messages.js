var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  db('message').then(function(user) {
    
    res.json(user);
    
  });
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
