var jwt = require('jwt-simple');
var jwtKey = 'Doo ts doo ts dance party.';


module.exports = function(req, res, next){
    var token = req.get('auth_key');  
          
    //Doe maar user ophalen
    if(!token){
        return res.json({ error: 'Auth token missing.' }).status(403);
    }   
    
    var userObject = jwt.decode(token, jwtKey);
    
    console.log(userObject);
    
    //is dit wel valid?
    
    req.user = userObject;
    
    next();    
}