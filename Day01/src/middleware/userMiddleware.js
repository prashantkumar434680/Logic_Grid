const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require('../Models/User');
require('dotenv').config();

const userMiddleware = async (req,res,next)=>{
    try{
       const {token} = req.cookies;
    //  before serve the request check that token is present or not
    if(!token){
        throw new Error("Token is not present.");
    }
       const payload = jwt.verify(token,process.env.JWT_KEY);
       const {_id} = payload;

       if(!_id)
       {
        throw new Error("Invalid Token");
       }
       
       const result = User.findOne(_id);
       if(!result){
        throw new Error("User Doesn't Exist");
       }

    //    if user exists then check that ye Redis ke block list m to present nhi hain

    const IsBlocked = await redisClient.exists(`token:${token}`);

    if(IsBlocked){
        throw new Error("Invalid Token");
    }
    req.result = result;

    next();
    }
    catch(err){
        res.send("Error: "+err);
    }
}

module.exports = userMiddleware;