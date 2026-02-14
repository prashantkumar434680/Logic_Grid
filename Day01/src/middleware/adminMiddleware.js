const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require('../Models/User');


const adminMiddleware = async (req,res,next)=>{

    try{
    //    first fetch the token from cookies
    const {token} = req.cookies;

    if(!token){
        throw new Error("Token is Not Present.");
    }

    const payload = jwt.verify(token,process.env.JWT_KEY);

    const {_id} = payload;

    if(!_id){
        throw new Error("Invalid token");
    }

    const result = await User.findOne(_id);

    if(!result){
        throw new Error("Invalid token");
    }

    if(payload.role!='admin'){
        throw new Error("Invalid Token");
    }

    // check in redis database that it's token is already blocked or not
    const IsBlocked = redisClient.exists(`token:${token}`);

    if(IsBlocked){
        throw new Error("This is not a valid token.");
    }
    req.result = result;
    next();
    }
    catch(err){
        res.send("Error: "+err);
    }
}

module.exports = adminMiddleware;