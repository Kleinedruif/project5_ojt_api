var jwt = require('jwt-simple');
var jwtKey = 'Doo ts doo ts dance party.';


module.exports = function(req, res, next){
    var token = req.get('auth_key');
    
    //Doe maar user ophalen
    if(!token){
        return res.json("yolololo je bent nu blauw");
    }
    
    var userObject = jwt.decode(key, token);
    
    //is dit wel valid?
    
    req.user = userObject;
    
    next();    
}