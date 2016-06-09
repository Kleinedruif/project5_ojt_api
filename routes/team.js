var express = require('express');
var router = express.Router();
var auth = require('../modules/auth');

/* GET home page. */
router.get('/', auth.requireLoggedIn, auth.requireRole('teamleider'), function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('team');

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (user) {

        res.json(user);

    });
});

router.get('/:id', auth.requireLoggedIn, auth.requireRole('teamleider'), function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('team').where({ 'guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (team) {

        res.json(team[0]);

    });

});

router.get('/:id/participants', auth.requireLoggedIn, auth.requireRole('teamleider'), function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('participant').where({ 'team_guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (users) {

        res.json(users);

    });

});

router.get('/:id/note', auth.requireLoggedIn, auth.requireRole('teamleider'), function(req, res, next) {
    
    var id = req.params.id;
    var type = req.query.type;
    var db = req.app.locals.db;
    var query = db('note').where('team_guid', id);
    
    if(type) {
        query.where('private', (type == 'private' ? 1 : 0));
    }
    
    query.then(function(notes) {
       res.json(notes); 
    });
    
});

router.post('/:id/note', auth.requireLoggedIn, auth.requireRole('teamleider'), function(req, res, next) {
   
   var id = req.params.id;
   var content = req.body.content;
   var type = req.body.type;
   var db = req.app.locals.db;
   
   if(content && type) {
       
       var typeNumerical = (type == 'private' ? 1 : 0);
       var query = db('note')
                   .insert({
                      guid: "",
                      team_guid: id,
                      private: typeNumerical,
                      content: content,
                      status: 'active' 
                   });
       
       query.then(function(message) {
           res.json({message: 'OK'});
       });
       
       
       
   } else {
       res.status(400).send('No content set!');
   }
    
});

router.get('/:id/score', auth.requireLoggedIn, auth.requireRole('teamleider'), function(req, res, next) {
    
    var db = req.app.locals.db;
    
    var query = db("team as t").where('t.guid', id)
                .innerJoin('participant as p', 't.guid', 'p.team_guid')
                .innerJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                .select('t.name as team_name', 'p.first_name', 'p.last_name', 'p.guid as participant_guid', 'pha.score');
    
    if(type == "total") {
        query.sum('pha.score as score').groupBy('p.guid');
    } else {
        query.select('pha.activity_guid');
    }
    
    query.then(function(score) {
        res.json(score);
    })
    
    
});

router.put('/:id/score', auth.requireLoggedIn, auth.requireRole('teamleider'), function(req, res, next) {
   
   var activity = req.body.activity_guid;
   var score = req.body.score;
   var id = req.params.id;
   
   if(activity && score) {
       
       var db = req.app.locals.db;
       var query = db('team as t')
                   .innerJoin('participant as p', 't.guid', 'p.team_guid')
                   .innerJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                   .where({
                       't.guid': id,
                       'pha.activity_guid': activity
                   }).update({
                       'pha.score': score
                   });
        
        query.then(function(message) {
            if(message == 0) {
                res.json({error: "Activity or team does not exist!"});
            } else {
                res.json({message: "OK"});
            }
        });
       
   } else {
       res.json({error: "Missing data!"});
   }

});

module.exports = router;
