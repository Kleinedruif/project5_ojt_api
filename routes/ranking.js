var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {

    var db = req.app.locals.db;

    var type = req.query.type;
    var gender = req.query.gender;
    var orderBy = (req.query.order ? req.query.order : "desc");
    var query;

    if (type) {

        if (type == "participants") {
            query = db('participant_has_activity as pha').select("pha.participant_guid", "p.first_name", "p.last_name", "p.gender", "p.team_guid", "p.shirt")
                .sum('pha.score as score')
                .innerJoin("participant as p", "pha.participant_guid", "p.guid")
                .groupBy('pha.participant_guid')
                .orderBy('pha.score', orderBy);
        }
        else if (type == "team") {

            query = db("team as t").select("t.guid as team_guid", "t.name as team_name")
                .innerJoin("participant as p", "t.guid", "p.team_guid")
                .innerJoin("participant_has_activity as pha", "p.guid", "pha.participant_guid")
                .sum("pha.score as score")
                .groupBy("t.guid")
                .orderBy('pha.score', orderBy);

        }
        else {
            res.json({ 'message': 'type is not applicable' });
        }

        if (gender) {

            gender = (gender == "m" ? 1 : 0);
            query.where('p.gender', gender);

        }


        query.then(function (score) {
            res.json(score);
        })

    } else {
        res.json({ 'message': 'type not set' });
    }

});

module.exports = router;
