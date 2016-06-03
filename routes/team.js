var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('team');

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (user) {

        res.json(user);

    });
});

router.get('/:id', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('team').where({ 'guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (team) {

        res.json(team[0]);

    });

});

router.get('/:id/participants', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('participant').where({ 'team_guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (users) {

        res.json(users);

    });

});

router.get('/:id/note', function(req, res, next) {
    
    var id = req.params.id;
    var type = req.query.type;
    var db = req.app.locals.db;
    var query = db('note').where('team_guid', id);
    
    if(type) {
        query.where('private', (type == "private" ? 1 : 0));
    }
    
    query.then(function(note) {
       res.json(note); 
    });
    
});

router.post('/:id/note', function(req, res, next) {
   
   var id = req.params.id;
   var content = req.body.content;
   var type = req.body.type;
   var db = req.app.locals.db;
   
   if(content && type) {
       
       var typeNumerical = (type == "private" ? 1 : 0);
       var query = db('note')
                   .insert({
                      guid: "",
                      team_guid: id,
                      private: typeNumerical,
                      content: content,
                      status: "active" 
                   });
       
       query.then(function(success) {
           res.json({success: "OK"});
       });
       
       
       
   } else {
       res.json({error: "No content set!"});
   }
    
});

module.exports = router;
