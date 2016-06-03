var express = require('express');
var router = express.Router();
var auth = require('../modules/auth');

/* GET home page. */
router.get('/', auth.requireLoggedIn, auth.requireRole('teamleider'), function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('team');

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (user) {

        res.json(user);

    });
});

router.get('/:id', auth.requireLoggedIn, auth.requireRole('teamleider'), function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('team').where({ 'guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (team) {

        res.json(team[0]);

    });

});

router.get('/:id/participants', auth.requireLoggedIn, auth.requireRole('teamleider'), function (req, res, next) {

    var db = req.app.locals.db;

    var query = db('participant').where({ 'team_guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (users) {

        res.json(users);

    });

});

module.exports = router;
