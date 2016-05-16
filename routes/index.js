var express = require('express');
var router = express.Router();

module.exports = function(io) {
    /* GET home page. */
    router.get('/', function(req, res, next) {
      res.render('index', { title: 'Express' });
    });


    router.post('/message', function(req, res, next) {
        console.log(req.body);

        // {body: {to (username), from (username), msg, date}}
        io.sockets.send(req.body);
        
        res.json({msg: 'succes'});
    });
    
    router.get('/retrieveToken', function(req, res,next){
        
    });
    
    return router;
}

//module.exports = router;
