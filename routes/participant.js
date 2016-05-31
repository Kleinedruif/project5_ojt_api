var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {

    var db = req.app.locals.db;

    db('participant').then(function (participants) {
        res.json(participants);
    });

});

/* GET home page. */
router.get('/:id', function (req, res, next) {

    var db = req.app.locals.db;

    db('participant').where('guid', req.params.id).then(function (participant) {
        res.json(participant);
    });

});

router.get('/:id/parents', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('participant as p').select('u.*').innerJoin('user as u', 'p.parent_guid', 'u.guid').where({ 'p.guid': req.params.id });

    if (req.query.status) {
        query.where('u.status', req.query.status);
    }

    query.then(function (users) {

        res.json(users);

    });

});

router.get('/:id/team', function (req, res, next) {

    var db = req.app.locals.db;

    var query = db.select("t.*").from("team as t")
        .leftOuterJoin('participant as p', 't.guid', 'p.team_guid')
        .where('p.guid', req.params.id);

    if (req.query.status) {
        query.where('t.status', req.query.status);
    }

    query.then(function (team) {

        res.json(team);

    });

});

module.exports = router;
