var express = require('express');
var async = require('async');

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
 
    var query = db('team as t')
                .innerJoin('participant as p', 't.guid', 'p.team_guid')
                .innerJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                .where('t.guid', req.params.id)
                .select('t.name as team_name', 'p.first_name', 'p.last_name', 'p.guid as participant_guid', 'pha.score')
                .sum('pha.score as score').groupBy('p.guid');
    
    query.then(function(score) {
        return res.json(score);
    });
});

router.put('/:id/score', auth.requireLoggedIn, auth.requireRole('teamleider'), function(req, res, next) {  
    var db = req.app.locals.db;     
    var activity = req.body.activity_guid;
    var score = req.body.score;
    var id = req.params.id;
   
   if(activity && score) {
       // Get all participants in the team
       db('participant').where({ 'team_guid': id }).where('status', 'active').then(function (participants) {
            if (participants && participants.length){             
                var size = participants.length;
                var count = 0;
                var succes = true;

                // Loop async of all the participants to add or update the score
                async.whilst(
                    function() {return count < size;},
                    function(callback) {
                        participants.forEach(function(participant){
                            // UPDATE the score              
                            db('participant as p')
                            .innerJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                            .where({
                                'p.guid': participant.guid,
                                'pha.activity_guid': activity
                            }).update({
                                'pha.score': score
                            }).then(function(message) {
                                // If update failed, insert the new values instead
                                if(message == 0) {   
                                    // INSERT the new score            
                                    db('participant_has_activity').insert({
                                        participant_guid: participant.guid,
                                        activity_guid: activity,
                                        score: score
                                    }).then(function(message) {
                                        if (message != 0) { succes = false; }
                                        count++;
                                    })
                                    // Make sure error is handled to avoind infinite loop
                                    .catch(function(err){
                                        count++;
                                        succes = false;
                                    })                        
                                } else {
                                    count++;
                                }
                            })
                            // Make sure error is handled to avoind infinite loop
                            .catch(function(err){
                                count++;
                                succes = false;
                            }) 
                        });               
                        setTimeout(function() {
                            callback(null, count);
                        }, 3000);
                    },
                    // On completion of all updates/inserts, call this function
                    function(err, n) {
                        if (err) { return res.status(400).json({message: 'Het toevoegen van scores is fout gegaan. '  + err}); }                
                        return succes ? res.json({message: 'OK'}) : res.status(400).json({message: 'Het toevoegen van scores is niet helemaal goed gegaan.'});
                    }
                );       
            } else {
                return res.status(404).json({message: "Het team bestaat niet."});
            }
        });
    } else {
       return res.status(400).json({message: "Ontbrekende data!"});
    }  
});

module.exports = router;
