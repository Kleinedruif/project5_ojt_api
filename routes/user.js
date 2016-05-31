// User Routes

"use strict"

var express = require('express');
var router = express.Router();

var path = require('path');
var validator = require('validator');
var User = require(path.resolve(__dirname, '../models/user-model'));
var ErrorMessages = require(path.resolve(__dirname, '../util/error-messages'));
var RouteAuth = require('../util/application-auth/route-auth');
var AuthToken = require(path.resolve(__dirname, '../util/application-auth/auth-token'));
var crypto = require('crypto');


router.post('/create', function(req, res, next) {

    var name = req.body.name;
  	var email = req.body.email;
    var password = req.body.password;

    if (!name || !name.first || !name.last || !email || !password) {
        return res.status(400).json({ message: 'All those boxes need filling.' });
    }

    if(!validator.isEmail(email)) {
    	return res.status(400).json({ message: 'Sorry, but that\'s an invalid email.' });
    }

    email = email.toLowerCase();

    var user = new User({
        email: email,
        password: password,
        name: name
    });
    
    user.authToken = AuthToken.create(email, user._id);
    
    var db = req.app.locals.db;
    
    db('user').insert({email: user.email, hash: user.hash, salt: user.salt, first_name: user.name.first, last_name: user.name.last, authToken: user.authToken}).then(function(inserts) {
      console.log(inserts.length + ' new books saved.');
    })
    .catch(function(error) {
      // If we get here, that means that neither the 'Old Books' catalogues insert,
      // nor any of the books inserts will have taken place.
      console.error(error);
    });
    return res.status(200).json(user.toObject({ virtuals: true }));
    /*user.save(function(err, createdUser) {

        if (err) {
            
        	if (err.errors && err.errors.email) {
        		return res.status(400).json({ message: err.errors.email.message });
        	}
        	else {
        		console.log(err);
        		return res.status(500).json({ message: ErrorMessages.unknown });	
        	}

        } 
        else {

            return res.status(200).json(createdUser.toObject({ virtuals: true }));

        }

    });*/

});

router.get('/get', RouteAuth.protect, function(req, res, next) {
    
    return res.status(200).json(req.user.toObject({ virtuals: true }));
    
});

router.post('/login', function(req, res, next) {
    
    var email = req.body.email;
    var password = req.body.password;

    if(!password || !email) {
        return res.status(400).json({ message: "We need both an email and password." });
    }
    
    email = email.toLowerCase();
    var db = req.app.locals.db;

    db('user as u').innerJoin('user_has_role as uhr', 'u.guid', 'uhr.user_guid').innerJoin('role as r', 'uhr.role_guid', 'r.guid').where('u.email',email).then(function(user){
        user = user[0];
        
        if (!user) {
            return res.status(400).json({ message: "Woops, wrong email or password." });
        } else {
            var salt = new Buffer(user.salt, 'base64');
            if(user.hash == crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64')){
                var authToken = AuthToken.create(email, user._id);
                db('user').where('email',email).update('authToken',authToken).then(function(inserts) {
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
                .catch(function(error) {
                    return res.status(500).json({ message: error });
                });
            } else {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }
        }


    });
    
});

router.get('/:id', function(req, res, next) {
    
  var db = req.app.locals.db;
  
  var query = db('user').where({'guid': req.params.id});
  
  if(req.query.status) {
      query.where('status', req.query.status);
  }
  
  query.then(function(user) {
    
    res.json(user);
    
  });
    
});

router.get('/:id/children', function(req, res, next) {
  let db = req.app.locals.db;
    
  let getChildren = function(){
    // Participant info ook nog hangen aan user 
    let query = db('participant as p').select('p.*', 't.name', 'ul.first_name as first_name_teamleader', 'ul.last_name as last_name_teamleader', 'ul.guid as guid_teamleader', 'uo.first_name as first_name_parent', 'uo.last_name as last_name_parent', 'uo.address', 'uo.city', 'uo.tel_nr', 'uo.email')
                                      .innerJoin('participant_parent as pp', 'p.guid', 'pp.participant_guid')
                                      .innerJoin('team as t', 't.guid', 'p.team_guid')
                                      .innerJoin('user as ul', 'ul.guid', 't.teamleader_guid')
                                      .innerJoin('user as uo', 'uo.guid', 'pp.parent_guid')
                                      .where('pp.parent_guid', req.params.id)
                                      .where('p.status', 'active')
                                      .groupBy('p.guid');
    
    if(req.query.status) {
        query.where('p.status', req.query.status);
    }
    
    query.then(getTraits);
  }
 
  let getTraits = function(children){
    for(let i=0; i<children.length; i++){
      let query = db('participant_trait as pt').select('pt.trait')
                                               .where('pt.participant_guid', children[i].guid);

      query.then(function(traits){
        //TODO find a way to make query handle this, as to get rid of the loop
        children[i].traits = [];
        traits.forEach(function(entry){
          children[i].traits.push(entry.trait); 
        });

        //TODO find better way to call next after being done getting data
        if(i==children.length-1) getClassifications(children);
      });
    }
  }

  let getClassifications = function(children){
    for(let i=0; i<children.length; i++){
      let query = db('participant_classification as pc').select('pc.classification')
                                                        .where('pc.participant_guid', children[i].guid);

      query.then(function(classifications){
        //TODO find a way to make query handle this, as to get rid of the loop
        children[i].classifications = [];
        classifications.forEach(function(entry){
          children[i].classifications.push(entry.classification); 
        });

        //TODO find better way to call next after being done getting data
        if(i==children.length-1) getNotes(children);
      });
    }
  }

  let getNotes = function(children){
    for(let i=0; i<children.length; i++){
      let query = db('note as n').select('n.*')
                                 .where('n.participant_guid', children[i].guid);

      query.then(function(notes){
        //TODO find a way to make query handle this, as to get rid of the loop
        children[i].notes = [];
        notes.forEach(function(entry){
          children[i].notes.push({
            guid: entry.guid,
            content: entry.content
          }); 
        });

        //TODO find better way to call next after being done getting data
        if(i==children.length-1) res.json(children);  
      });
    }
  }

  getChildren();
});

module.exports = router;
