var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {

    var db = req.app.locals.db;

    db('participant').then(function (participants) {
        res.json(participants);
    });

});

/* GET home page. */
router.get('/:id', function (req, res, next) {

    var db = req.app.locals.db;

    db('participant').where('guid', req.params.id).then(function (participant) {
        res.json(participant);
    });

});

router.get('/:id/parents', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('participant as p').select('u.*').innerJoin('user as u', 'p.parent_guid', 'u.guid').where({ 'p.guid': req.params.id });

    if (req.query.status) {
        query.where('u.status', req.query.status);
    }

    query.then(function (users) {

        res.json(users);

    });

});

router.get('/:id/team', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db.select("t.*").from("team as t")
        .leftOuterJoin('participant as p', 't.guid', 'p.team_guid')
        .where('p.guid', req.params.id);

    if (req.query.status) {
        query.where('t.status', req.query.status);
    }

    query.then(function (team) {

        res.json(team);

    });

});

router.get('/:id/score', function(req, res, next) {
    
    var id = req.params.id;
    var type = req.query.type;
    var db = req.app.locals.db;
    var query = db('participant_has_activity as pha').where('pha.participant_guid', id)
                .innerJoin('participant as p', 'pha.participant_guid', 'p.guid')
                .select('p.first_name', 'p.last_name', 'pha.participant_guid', 'pha.score');
    
    if(type == "total") {
        query.sum('pha.score as score');
    } else {
        query.select('pha.activity_guid');
    }
    
    query.then(function(score) {
        res.json(score);
    })
    
    
});

router.put('/:id/score', function(req, res, next) {
   
   var activity = req.body.activity_guid;
   var score = req.body.score;
   var id = req.params.id;
   
   if(activity && score) {
       
       var db = req.app.locals.db;
       var query = db('participant_has_activity')
                   .where({
                       participant_guid: id,
                       activity_guid: activity
                   }).update({
                       score: score
                   });
        
        query.then(function(message) {
            if(message == 0) {
                res.json({error: "Activity or participant does not exist!"});
            } else {
                res.json({message: "OK"});
            }
        });
       
   } else {
       res.json({error: "Missing data!"});
   }

});

router.get('/:id/note', function(req, res, next) {
    
    var id = req.params.id;
    var type = req.query.type;
    var db = req.app.locals.db;
    var query = db('note').where('participant_guid', id);
    
    if(type) {
        query.where('private', (type == "private" ? 1 : 0));
    }
    
    query.then(function(notes) {
       res.json(notes); 
    });
    
});

router.post('/:id/note', function(req, res, next) {
   
   var id = req.params.id;
   var content = req.body.content;
   var type = req.body.type;
   var db = req.app.locals.db;
   
   if(content && type) {
       
       var typeNumerical = (type == 'private' ? 1 : 0);
       var query = db('note')
                   .insert({
                      guid: "",
                      participant_guid: id,
                      private: typeNumerical,
                      content: content,
                      status: 'active' 
                   });
       
       query.then(function(message) {
           res.json({message: 'OK'});
       });
       
       
       
   } else {
       res.status(400).send("No content set!");
   }
    
});

module.exports = router;
