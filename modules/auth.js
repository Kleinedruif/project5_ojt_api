var bcrypt = require('bcrypt');
var crypto = require('crypto');
var config = require('../config/auth.json');

module.exports = {
    // The user must be logged in to access this route.
    requireLoggedIn: function(req, res, next) {
        if (!req.body.authToken) {
            return res.status(401).json({message: 'U moet ingelogd zijn om deze pagina te bezoeken.'});
        }
        
        db('user').where('authToken', req.body.authToken).then(function(user) {
            return next();
        })
        .catch(function(error) {
            return res.status(500).json({ message: error });
        });
        
        return res.status(401).json({message: 'U moet ingelogd zijn om deze pagina te bezoeken.'});
    },
    
    requireRole: function(role) {
        return function(req, res, next) {
            userRole = req.session.user.role_name;
            if (!req.session.authenticated) {
                return res.status(401).json({message: 'U moet ingelogd zijn om deze pagina te bezoeken.'});
            }
            
            if (userRole == role) {
                return next();
            }
            if (role == 'organisatie' || role == 'directie') {
                return res.status(403).json({message: 'U heeft geen rechten om deze pagina te bezoeken.'});
            }
            if ((role == 'teamleider' || role == 'ouder') && (userRole == 'organisatie' || userRole == 'directie')) {
                return next();
            }
            if ((role == 'ouder') && (userRole == 'organisatie' || userRole == 'directie') || userRole == 'teamleider') {
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
                       .where('u.email',email)
                       .then(function(user){
            user = user[0];
            
            if (!user) {
                return res.status(401).json({ message: "U heeft een verkeerde email of wachtwoord ingevuld." });
            } else {
                bcrypt.compare(password, user.hash, function(err, result) {
                    if (result) {
                        var authToken = crypto.randomBytes(64).toString('hex');
                        
                        db('user').where('email', email).update('authToken', authToken).then(function(inserts) {
                            return res.status(200).json({
                                message: "OK",
                                auth_token: authToken,
                                
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
