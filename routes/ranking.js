var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {  
    var db = req.app.locals.db;
        
    var orderBy = (req.query.order ? req.query.order : "desc");
                                                 
    query = db('participant as p').select("p.first_name", "p.last_name", "p.gender", "p.team_guid", 't.name', "p.shirt", "p.guid", "p.team_guid")
                                .leftJoin("team as t", "t.guid", "p.team_guid")
                                .leftJoin('participant_has_activity as pha', 'p.guid', 'pha.participant_guid')
                                .sum('pha.score as score')
                                .where('p.status', 'active')
                                .where('t.status', 'active')
                                .groupBy('p.guid')
                                .orderBy('pha.score', orderBy);
    
    query.then(function(score) {
        res.json(score);
    })
});

module.exports = router;
