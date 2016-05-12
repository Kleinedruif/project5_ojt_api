var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(UNDEFINED);
});

//id persoon
router.get('/person/:param', function(req, res, next) {
  
  var db = req.app.locals.db;

  db('user_has_activicty')
  .innerJoin('user', 'user_has_activicty.user_guid', 'user.guid')
  .where('user_guid', req.params.param).then(function(user) {
    console.log(user);
    
    var score = 0;
    user.forEach(function(us) {
      score += us.score;
    });
    res.json({"score": score});
  });
 
});

//id persoon
router.get('/team/:param', function(req, res, next) {
  
  var db = req.app.locals.db;
  var score = 0;
  
  db('user_has_activicty').where('user_guid', req.params.param).then(function(user) {
    user.forEach(function(us) {
      score += us.score;
    });
    res.json({"score": score});
  });
 
});

module.exports = router;
