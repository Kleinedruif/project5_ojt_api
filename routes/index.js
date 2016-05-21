var express = require('express');
var router = express.Router();

module.exports = function(io) {
    /* GET home page. */
    router.get('/', function(req, res, next) {
      res.render('index', { title: 'Express' });
    });

    // Recieve messages here
    router.post('/', function(req, res, next) {
        console.log(req.body);
        
        // Send message back to all sockets
        io.sockets.send(req.body);
        
        res.json({msg: req.body});
    });
    
    return router;
}
