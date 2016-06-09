var express = require('express');
var router = express.Router();


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
       
     if(id){
         query.where({'event_guid': id}).then(function(result){
             if(result){
                 console.log(result);
                 res.json(result);
             }
             else{
                 res.status(404);
             }
         });
     }
     else{
         res.status(404);
     }
 });
 
 // Geef mij allezzzz bij dit event.
 router.get('/:id/', function(req, res, next){
     
 })



module.exports = router;