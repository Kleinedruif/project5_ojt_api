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



module.exports = router;