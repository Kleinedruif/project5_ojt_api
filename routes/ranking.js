var express = require('express');
var router = express.Router();

//testdata

var bert = {
  "id": "1",
  "naam": "Bert",
  "rank": "3"
};

var harry = {
  "id": "2",
  "naam": "Harry",
  "rank": "5"
};

var emma = {
  "id": "3",
  "naam": "Emma",
  "rank": "1"
};

var piet = {
  "id": "4",
  "naam": "Piet",
  "rank": "6" 
};

var gert = {
  "id": "5",
  "naam": "Gert",
  "rank": "2"
};

var anniek = {
  "id": "6",
  "naam": "Anniek",
  "rank": "4"
};

var kids = [bert, harry, emma, piet, gert, anniek];

var js = {
    "teams": 
    [
      {
        "id": "1",
        "naam": "naam1",
        "rank": "1",
        "kids": 
        [
          bert,
          harry
        ]
      },
      {
        "id": "2",
        "naam": "naam2",
        "rank": "2",
        "kids": 
        [
          emma, 
          piet
        ]
      },
      {
        "id": "3",
        "naam": "naam3",
        "rank": "3",
        "kids": 
        [
          gert,
          anniek
        ]
      }
    ]
};


/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(js);
});

//id persoon
router.get('/person/:param', function(req, res, next) {
  
  var person;
  var persons = kids.length;
   
  
  for(var i = 0; i < persons; i++) {
    if(kids[i]['id'] == req.params.param || kids[i]['naam'] == req.params.param) {
      person = kids[i];
      break;
    }
  }
  
  if(person == null) 
    res.json("0");
  else
    res.json(person['rank']);
 
});

//id persoon
router.get('/team/:param', function(req, res, next) {
  
  var team;
  var teams = js['teams'].length;
   
  
  for(var i = 0; i < teams; i++) {
    if(js['teams'][i]['id'] == req.params.param || js['teams'][i]['naam'] == req.params.param) {
      team = js['teams'][i];
      break;
    }
  }
 
  if(team == null) 
    res.json("0");
  else
    res.json(team['rank']);
 
});

module.exports = router;
