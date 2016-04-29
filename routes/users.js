// User Routes

var path = require('path');
var validator = require('validator');
var User = require(path.resolve(__dirname, '../models/user-model'));
var ErrorMessages = require(path.resolve(__dirname, '../util/error-messages'));
var AuthToken = require(path.resolve(__dirname, '../util/application-auth/auth-token'));
var crypto = require('crypto');

exports.create = function(req, res) {
	  var name = req.body.name
  	var email = req.body.email;
    var password = req.body.password;
    console.log(name.first);
    if (!name || !name.first || !name.last || !email || !password) {
        return res.status(400).json({ message: 'All those boxes need filling.' });
    }

    if(!validator.isEmail(email)) {
    	return res.status(400).json({ message: 'Sorry, but that\'s an invalid email.' });
    }

    email = email.toLowerCase();

    var user = new User({
        email: email
        , password: password
        , name: name
    });
    
    user.authToken = AuthToken.create(email, user._id);
    console.log(user);
    var knex = require('knex')(
    {
        client: 'mysql',
            connection: {
                host     : '46.17.1.173',
                port     : '3306',
                user     : 'm2mtest_groepJ',
                password : 'SFKYvUleAR',
                database : 'm2mtest_groepJ',
                charset  : 'utf8'
            },
            pool: {
                min: 1,
                max: 4
            },
            useNullAsDefault: true
    });
    knex('users').insert({email: user.email, hash: user.hash, salt: user.salt, name: user.name.first+' '+user.name.last, authToken: user.authToken}).then(function(inserts) {
      console.log(inserts.length + ' new books saved.');
    })
    .catch(function(error) {
      // If we get here, that means that neither the 'Old Books' catalogues insert,
      // nor any of the books inserts will have taken place.
      console.error(error);
    }).finally(function() {
        knex.destroy();
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

};

exports.login = function(req, res) {

	var email = req.body.email;
    var password = req.body.password;

    if(!password || !email) {
        return res.status(400).json({ message: "We need both an email and password." });
    }
    
    email = email.toLowerCase();
    var knex = require('knex')(
    {
        client: 'mysql',
            connection: {
                host     : '46.17.1.173',
                port     : '3306',
                user     : 'm2mtest_groepJ',
                password : 'SFKYvUleAR',
                database : 'm2mtest_groepJ',
                charset  : 'utf8'
            },
            pool: {
                min: 1,
                max: 4
            },
            useNullAsDefault: true
    });
    console.log(email);
    console.log(password);
    knex('users').where('email',email).then(function(user){
        console.log(user);
        user = user[0];
        
        if (!user) {
            return res.status(400).json({ message: "Woops, wrong email or password." });
        }
        else{
          var salt = new Buffer(user.salt, 'base64');
          if(user.hash == crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64')){
            var authToken = AuthToken.create(email, user._id);
            knex('users').where('email',email).update('authToken',authToken).then(function(inserts) {
              console.log('Succes');
              return res.status(200).json({ message: "OK", authToken: authToken });
            })
            .catch(function(error) {
               return res.status(500).json({ message: error });
            });
          }
          else {
            return res.status(400).json({ message: 'Invalid Credentials' });
          }
        }


    }).finally(function() {
        knex.destroy();
    });
};

exports.get = function(req, res) {

	return res.status(200).json(req.user.toObject({ virtuals: true }));

};