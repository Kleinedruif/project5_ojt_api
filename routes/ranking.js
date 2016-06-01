var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  var db = req.app.locals.db;
  
  var type = req.query.type;
  var orderBy = (req.query.order ? req.query.order : "desc");
  var query;
  
  if(type) {  
      if(type == "participants") {                                                  
        query = db('participant as p').select("p.first_name", "p.last_name", "p.gender", "p.team_guid", 't.name', "p.shirt", "p.guid", "p.team_guid")
                                                    .leftJoin("team as t", "t.guid", "p.team_guid")
                                                    .leftJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                                                    .sum('pha.score as score')
                                                    .where('p.status', 'active')
                                                    .where('t.status', 'active')
                                                    .groupBy('p.guid')
                                                    .orderBy('pha.score', orderBy);
      } else if(type == "team") {       
        query = db("team as t").select("t.guid as team_guid", "t.name as team_name")
                              .innerJoin("participant as p", "t.guid", "p.team_guid")
                              .innerJoin("participant_has_activity as pha", "p.guid", "pha.participant_guid")
                              .sum("pha.score as score")
                              .groupBy("t.guid")
                              .orderBy('pha.score', orderBy);      
        
      } else {
        return res.json({'message': 'type is not applicable'});
      }    
      
      query.then(function(score) {
          res.json(score);
      });   
  } else {
      return res.json({'message': 'type not set'});
  }

});

router.get('/:id', function(req, res, next){
    var db = req.app.locals.db;
    var id = req.params.id;
    
    var query = query = db('participant as p').select('p.shirt', 'p.team_guid')
                      .leftJoin('team as t', 't.guid', 'p.team_guid')
                      .leftJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid') 
                      .sum('pha.score as score')
                      .where('p.status', 'active')
                      .where('t.status', 'active')
                      .where('p.guid', id)
      
    query.then(function(individualScore) {
        console.log(individualScore[0].team_guid);
        query = db('participant as p')
                            .innerJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                            .sum('pha.score as scores')
                            .where('p.status', 'active')
                            .where('p.team_guid', individualScore[0].team_guid)
                            
        query.then(function(team_score) {
            res.json({score: individualScore[0].score, shirt: individualScore[0].shirt, team_guid: individualScore[0].team_guid, team_score: team_score[0].scores});
        });  
    });   
});

module.exports = router;
