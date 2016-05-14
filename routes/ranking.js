var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  var type = req.query.type;
  var gender = req.query.gender;
  var orderBy = (req.query.order ? req.query.order : "desc");
  var query;
  
  if(type) {
    
    if(type == "participants") {
      query = db('user_has_activicty as uha').select("uha.user_guid", "u.name", "u.gender", "u.team_guid", "u.shirt")
                                             .sum('uha.score as score')
											 .innerJoin("user as u", "uha.user_guid", "u.guid")
                                             .groupBy('user_guid')
                                             .orderBy('uha.score', orderBy);
    } 
    else if(type == "team") {
      
      query = db("team as t").select("t.guid as team_guid", "t.name as team_name")
                             .innerJoin("user as u", "t.guid", "u.team_guid")
                             .innerJoin("user_has_activicty as uha", "u.guid", "uha.user_guid")
                             .sum("uha.score as score")
                             .groupBy("t.guid")
                             .orderBy('uha.score', orderBy);      
      
    }
    else {
      res.json({'message': 'type is not applicable'});
    }
    
    if(gender) {
      
      gender = (gender == "m" ? 1 : 0);
      query.where('u.gender', gender);
      
    }
    
    
    query.then(function(score) {
      res.json(score);
    })
    
  } else {
    res.json({'message': 'type not set'});
  }
  
});

module.exports = router;
