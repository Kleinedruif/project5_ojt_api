var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log('kom ik heir?');
  res.render('login', { Title: 'Login' });
});

module.exports = router;
