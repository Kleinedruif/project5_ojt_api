var bcrypt = require('bcrypt');
var crypto = require('crypto');
var config = require('../config/config');

module.exports = {
    // The user must be logged in to access this route.
    requireLoggedIn: function(req, res, next) {             
        if (!req.query.authToken) {
            return res.status(401).json({message: 'U moet ingelogd zijn om deze pagina te bezoeken.'});
        } else if (!req.query.api_key){
            return res.status(401).json({message: 'No api key given.'});
        } else if (req.query.api_key != config.webserver_api_key){
            return res.status(401).json({message: 'Invallid api key.'});
        }
        
        var db = req.app.locals.db;
        db('user').innerJoin('user_has_role as uhr', 'uhr.user_guid', 'user.guid').innerJoin('role as r', 'uhr.role_guid', 'r.guid').where('authToken', req.query.authToken).then(function(user) {
            if (user.length != 1) {
                return res.status(500).json({ message: 'Deze token is niet valid' });
            } else {
                var timeDiff = getCurrentDate() - user[0].token_experation;
                // Session off 1 day
                if (timeDiff > 86400000) return res.status(417).json({message: 'Token is niet meer valid, log opnieuw in'});
                            
                req.role = user[0].name;
                return next(); 
            }           
        });
    },
    
    requireRole: function(role) {
        return function(req, res, next) {
            userRole = req.role;

            if (userRole == role) {
                return next();
            } else if ((role == 'organisatie' || role == 'directie') && (userRole !='organisatie' && userRole != 'directie')) {
                return res.status(403).json({message: 'U heeft geen rechten om deze pagina te bezoeken.'});
            } else if ((role == 'teamleider' || role == 'ouder') && (userRole == 'organisatie' || userRole == 'directie')) {
                return next();
            } else if ((role == 'ouder' && (userRole == 'organisatie' || userRole == 'directie' || userRole == 'teamleider'))) {
                return next();
            }
            
            return res.status(403).json({message: 'U heeft geen rechten om deze pagina te bezoeken.'});
        }
    },
    
    // Try to login the user.
    login: function(req, res, email, password) {
        var db = req.app.locals.db;

        email = email.trim();
        password = password.trim();

        db('user as u').innerJoin('user_has_role as uhr', 'u.guid', 'uhr.user_guid')
                       .innerJoin('role as r', 'uhr.role_guid', 'r.guid')
                       .where('u.email' ,email)
        .then(function(user){
            user = user[0];

            if (!user) {                     
                var fail = onLoginFail(req.connection.remoteAddress);
                if (fail && Date.now() < fail.nextTry) {
                    // Throttled. Can't try yet.
                    return res.status(429).json({message: 'Te vaak geprobeerd opnieuw in te loggen, probeer het over 10 minuten nogmaals'});
                } else {
                    return res.status(401).json({message: 'U heeft een verkeerde email of wachtwoord ingevuld.' });
                }               
            } else {
                onLoginSuccess(req.connection.remoteAddress);
                bcrypt.compare(password, user.hash, function(err, result) {
                    if (result) {
                        var authToken = crypto.randomBytes(64).toString('hex');
                        
                        // Get current data in the right formate
                        var date = getCurrentDate();
                        
                        db('user').where('email', email).update('authToken', authToken).update('token_experation', date).then(function(inserts) {
                            return res.status(200).json({
                                message: "OK",
                                auth_token: authToken,
                                
                                // User data
                                guid: user.user_guid,
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
                        return res.status(401).json({ message: "U heeft een verkeerde email of wachtwoord ingevuld." });
                    }
                });
            }
        });
    },
    
    // Logs the user out.
    logout: function(req) {
        db('user').where('email', email).update('authToken', '').then(function(inserts) {
            return res.status(200).json({
                message: "OK"
            });
        })
        .catch(function(error) {
            return res.status(500).json({ message: error });
        });
    }
};

function getCurrentDate(){
    var d = new Date,
        dformat = [d.getMonth() + 1,
            d.getDate(),
            d.getFullYear()].join('/') + ' ' +
            [d.getHours(),
                d.getMinutes(),
                d.getSeconds()].join(':');
    return d;
}

var failures = {};

function onLoginFail(ip) {
    var fail = failures[ip];
    if (fail == undefined) var fail = failures[ip] = {count: 0, nextTry: new Date()};
    
    ++fail.count;
    // If 5 attempts, wait 10 min to try again
    if (fail.count == 5){
         fail.nextTry.setTime(Date.now() + MINS10); // Wait another two seconds for every failed attempt
    }
   
    return fail;
}

function onLoginSuccess(ip) { delete failures[ip]; }

// Clear log every 10 min
var MINS10 = 600000, MINS30 = 1 * MINS10;
setInterval(function() {
    for (var ip in failures) {
        if (Date.now() - failures[ip].nextTry > MINS10) {
            delete failures[ip];
        }
    }
}, MINS30);
