var express = require('express');
var knexnest = require('knexnest');
var auth = require('../modules/auth');
var router = express.Router();

// Get all events
router.get('/', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next) {
    var db = req.app.locals.db;
    var status = req.query.active ? ((req.query.active == 'active' || req.query.active == 'inactive') ? req.query.active : 'active') : 'active';
    
    var query = db('event').orderBy('year', 'DESC').where({'status': status});
 
    if(req.query.year){
        query.where({'year': req.query.year});          
    }    

    query.then(function(result){
        if(result && result.length){
            return res.json(result); 
        } else {
            return res.status(404).json({message: "Er bestaat geen event in het jaar '" + req.query.year + "' die '" + status + "' is"});
        }
    });    
});
 
router.get('/:id/days', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
    var db = req.app.locals.db;     
    var id = req.params.id;
    var query = db('day');  
    
    query.where({'event_guid': id}).then(function(result){
        if(result && result.length){
            return res.json(result);
        } else {
            return res.status(404).json({message: 'Er zijn geen dagen gevonden voor dit evenement'});
        }
    });
});
 
// Possible query strings: active(0/1 for inactive/active), assessable(0/1 for false/true)
router.get('/:id/', auth.requireLoggedIn, auth.requireRole('ouder'), function(req, res, next){
    var db = req.app.locals.db;     
    var id = req.params.id;
    var status = req.query.active ? (req.query.active == 0 ? 'inactive' : 'active') : 'active';
    
    /* Knexnest:
        Start a property with _
        Because of this select statement, Activities will be a property of Day.
        For some reason (found this out after an hour), if you write _activities only, Knexnest only binds one day as a property. 
        Therefore, arrays should be written BETWEEN underscores, with its property starting with _ 
    */
    var query = db('day AS d');
    query.select(
            'd.guid AS _dayId',
            'd.date AS _date',
            'a.guid AS _activities__activityId',
            'a.time AS _activities__time',
            'a.name AS _activities__name',
            'a.assessable AS _activities__assessable',
            'a.status AS _activities__status'                
    ).innerJoin('activity AS a', 'a.day_guid', 'd.guid')
    .where({'d.event_guid': id})
    .where({'a.status': status})
    .orderBy('d.date', 'ASC')
    .orderBy('a.time', 'ASC');     

    if(req.query.assessable){
        query.where({'a.assessable': req.query.assessable});
    } 

    // Use knexnest(query), usage is the same as normal
    knexnest(query).then(function(result){
        // Check for null, because knexnest returns null on an empty object/array
        if(result != null){
            return res.json(result);
        } else {
            return res.status(404).json({message: "Er zijn geen activiteiten gevonden voor dit evenement"});
        }
    });
});

module.exports = router;