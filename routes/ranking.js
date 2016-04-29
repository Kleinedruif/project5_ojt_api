var express = require('express');
var router = express.Router();

var js = {
    "appel": "ja",
    "Kokosnoot": "nee"
};


/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(js);
});

router.get('/:id', function(req, res, next) {
   res.send(req.params.id);
   ress.json(js); 
});


module.exports = router;
