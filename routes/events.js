var express = require('express');
var knexnest = require('knexnest');
var router = express.Router();

var self = this;


// Function to check if an object is empty. Thanks to StackOverflow
var isEmpty = function(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true && JSON.stringify(obj) === JSON.stringify({});
}

// get events, ez
router.get('/', function (req, res, next) {
    var db = req.app.locals.db;
    var query = db('event');
    
    var year = req.query.year;
    var active = req.query.active;
    
    if(year){
        query.where({'year': year});          
    }
    if(active){       
       query.where({'status': active});
    }   
    query.then(function(result){
        return res.json(result);
    });    
 });
 
 router.get('/:id/days', function(req, res, next){
     var db = req.app.locals.db;     
     var id = req.params.id;
     var query = db('day');  
       
     query.where({'event_guid': id}).then(function(result){
        if(isEmpty(result)){
            console.log(result);
            res.json(result);
        }
        else{
            res.send(result).status(404);
        }
    });
 });
 
 // Possilbe query strings: active(0/1 for inactive/active), assessable(0/1 for false/true)
 router.get('/:id/', function(req, res, next){
    var db = req.app.locals.db;     
    var id = req.params.id;
    var active = req.query.active;
    var assessable = req.query.assessable
    
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
    );  
    query.innerJoin('activity AS a', 'a.day_guid', 'd.guid');

    query.where({'d.event_guid': id});
    
    //check for query parameter
    if(active == 1){
        query.where({'a.status': 'active'});
    }
    if(active == 0){
        query.where({'a.status': 'inactive'});
    }

    if(assessable == 1){
        query.where({'a.assessable': assessable});
    }
    if(assessable == 0){
        query.where({'a.assessable': assessable});
    }

    // Use knexnest(query), usage is the same as normal
    knexnest(query).then(function(result){
        if(result != null){
            res.json(result);
        }
        else{
            res.json([]).status(404);
        }
    });
 });


module.exports = router;