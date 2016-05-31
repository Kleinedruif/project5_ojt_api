// User Routes

"use strict"

let express = require('express');
let router = express.Router();

let path = require('path');
let validator = require('validator');
let User = require(path.resolve(__dirname, '../models/user-model'));
let ErrorMessages = require(path.resolve(__dirname, '../util/error-messages'));
let RouteAuth = require('../util/application-auth/route-auth');
let AuthToken = require(path.resolve(__dirname, '../util/application-auth/auth-token'));
let crypto = require('crypto');

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

router.post('/create', function (req, res, next) {
    let user = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    });

    if (!user.name || !user.name.first || !user.name.last || !user.email || !user.password) {
        return res.status(400).json({ message: 'Request body is incomplete' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Sorry, but that\'s an invalid email.' });
    }

    email = email.toLowerCase();
    user.authToken = AuthToken.create(email, user._id);

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

router.get('/get', RouteAuth.protect, function (req, res, next) {
    return res.status(200).json(req.user.toObject({ virtuals: true }));
});

router.post('/login', function (req, res, next) {
    let email = req.body.email.toLowerCase();
    let password = req.body.password;

    if (!password || !email) {
        return res.status(400).json({ message: "We need both an email and password." });
    }

    let db = req.app.locals.db;

    db('user as u').innerJoin('user_has_role as uhr', 'u.guid', 'uhr.user_guid')
        .innerJoin('role as r', 'uhr.role_guid', 'r.guid')
        .where('u.email', email).then(function (user) {
            user = user[0];

            if (!user) {
                return res.status(400).json({ message: "Woops, wrong email or password." });
            } else {
                let salt = new Buffer(user.salt, 'base64');
                if (user.hash == crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64')) {
                    let authToken = AuthToken.create(email, user._id);
                    db('user').where('email', email).update('authToken', authToken).then(function (inserts) {
                        return res.status(200).json({
                            message: "OK",
                            authToken: authToken,

                            // User data
                            guid: user.guid,
                            team_guid: user.team_guid,
                            status: user.status,
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            role_guid: user.role_guid,
                            role_name: user.name             // Role name
                        });
                    })
                        .catch(function (error) {
                            return res.status(500).json({ message: error });
                        });
                } else {
                    return res.status(400).json({ message: 'Invalid Credentials' });
                }
            }
        });

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

router.get('/:id/children', function (req, res, next) {
    let db = req.app.locals.db;

    let getChildren = function () {
        let query = db('participant as p').select('p.*')
            .innerJoin('participant_parent as pp', 'p.guid', 'pp.participant_guid')
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
