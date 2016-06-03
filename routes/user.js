// User Routes

"use strict"

let express = require('express');
let router = express.Router();

let path = require('path');
let validator = require('validator');
let crypto = require('crypto');
let auth = require('../modules/auth');

let multer = require('multer'); // multipart/form-data middleware
let storage = multer.diskStorage({
    destination: './tmp/',
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(err)

            cb(null, raw.toString('hex') + path.extname(file.originalname))
        })
    }
})
let upload = multer({ storage: storage });

let fs = require('fs');
let ssh2 = require('ssh2');

router.post('/create', function(req, res, next) {
    let user = {
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        name: req.body.name
    };

    if (!user.name || !user.name.first || !user.name.last || !user.email || !user.password) {
        return res.status(400).json({ message: 'Request body is incomplete' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Sorry, but that\'s an invalid email.' });
    }

    email = email.toLowerCase();
    user.authToken = crypto.randomBytes(64).toString('hex');
    
    let db = req.app.locals.db;

    db('user').insert({ email: user.email, hash: user.hash, salt: user.salt, first_name: user.name.first, last_name: user.name.last, authToken: user.authToken })
        .then(function (inserts) {
            console.log(inserts.length + ' new user saved.');
        })
        .catch(function (error) {
            console.error(error);
        })
        ;

    return res.status(200).json(user.toObject({ virtuals: true }));
});

router.get('/get', auth.requireLoggedIn, function(req, res, next) {
    return res.status(200).json(req.user.toObject({ virtuals: true }));
});

router.post('/login', function (req, res, next) {
    let email = req.body.email.toLowerCase();
    let password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ message: "Vul alstublieft een email en een wachtwoord in." });
    }

    auth.login(req, res, email, password);
});

router.get('/:id', function (req, res, next) {
    let db = req.app.locals.db;
    let query = db('user').where({ 'guid': req.params.id });

    if (req.query.status) {
        query.where('status', req.query.status);
    }

    query.then(function (user) {
        res.json(user);
    });
});

router.get('/:id/note', function(req, res, next) {
    
    var id = req.params.id;
    var type = req.query.type;
    var db = req.app.locals.db;
    var query = db('note').where('user_guid', id);
    
    if(type) {
        query.where('private', (type == "private" ? 1 : 0));
    }
    
    query.then(function(note) {
       res.json(note); 
    });
    
});

router.get('/:id/children', function (req, res, next) {
    let db = req.app.locals.db;

    let getChildren = function () {
        let query = db('participant as p').select('p.*', 't.name', 'ul.first_name as first_name_teamleader', 'ul.last_name as last_name_teamleader', 'ul.guid as guid_teamleader', 'uo.first_name as first_name_parent', 'uo.last_name as last_name_parent', 'uo.address', 'uo.city', 'uo.tel_nr', 'uo.email')
            .innerJoin('participant_parent as pp', 'p.guid', 'pp.participant_guid')
            .innerJoin('team as t', 't.guid', 'p.team_guid')
            .innerJoin('user as ul', 'ul.guid', 't.teamleader_guid')
            .innerJoin('user as uo', 'uo.guid', 'pp.parent_guid')
            .where('pp.parent_guid', req.params.id)
            .groupBy('p.guid');

        if (req.query.status) {
            query.where('p.status', req.query.status);
        }

        query.then(getTraits);
    }

    let getTraits = function (children) {
        for (let i = 0; i < children.length; i++) {
            let query = db('participant_trait as pt').select('pt.trait')
                .where('pt.participant_guid', children[i].guid);

            query.then(function (traits) {
                //TODO find a way to make query handle this, as to get rid of the loop
                children[i].traits = [];
                traits.forEach(function (entry) {
                    children[i].traits.push(entry.trait);
                });

                //TODO find better way to call next after being done getting data
                if (i == children.length - 1) getClassifications(children);
            });
        }
    }

    let getClassifications = function (children) {
        for (let i = 0; i < children.length; i++) {
            let query = db('participant_classification as pc').select('pc.classification')
                .where('pc.participant_guid', children[i].guid);

            query.then(function (classifications) {
                //TODO find a way to make query handle this, as to get rid of the loop
                children[i].classifications = [];
                classifications.forEach(function (entry) {
                    children[i].classifications.push(entry.classification);
                });

                //TODO find better way to call next after being done getting data
                if (i == children.length - 1) getNotes(children);
            });
        }
    }

    let getNotes = function (children) {
        for (let i = 0; i < children.length; i++) {
            let query = db('note as n').select('n.*')
                .where('n.participant_guid', children[i].guid);

            query.then(function (notes) {
                //TODO find a way to make query handle this, as to get rid of the loop
                children[i].notes = [];
                notes.forEach(function (entry) {
                    children[i].notes.push({
                        guid: entry.guid,
                        content: entry.content
                    });
                });

                //TODO find better way to call next after being done getting data
                if (i == children.length - 1) res.json(children);
            });
        }
    }

    getChildren();
});

router.post('/image', upload.single('file'), function (req, res, next) {
    let conn = new ssh2();

    conn.on(
        'connect',
        function () {
            console.log("- connected");
        }
    );

    conn.on(
        'ready',
        function () {
            console.log("- ready");

            conn.sftp(
                function (err, sftp) {
                    if (err) {
                        console.log("Error, problem starting SFTP: %s", err);
                    }

                    console.log("- SFTP started");

                    // upload file
                    let readStream = fs.createReadStream(req.file.path);
                    let writeStream = sftp.createWriteStream("user/" + req.body.id + ".jpg");

                    // what to do when transfer finishes
                    writeStream.on(
                        'close',
                        function () {
                            console.log("- file transferred");
                            sftp.end();
                            res.status(200).send('file succesfully uploaded');
                            fs.unlinkSync(req.file.path);
                        }
                    );

                    // initiate transfer of file
                    readStream.pipe(writeStream);
                }
            );
        }
    );

    conn.on(
        'error',
        function (err) {
            console.log("- connection error: %s", err);
            res.status(400).send('file upload fialed');
        }
    );

    conn.on(
        'end',
        function () {
            res.status(200).send('file succesfully uploaded');
        }
    );

    conn.connect({
        "host": "omejoopstour.timohoff.nl",
        "port": 22,
        "username": "omejoopstour",
        "password": "aar04dappel"
    });
});

module.exports = router;