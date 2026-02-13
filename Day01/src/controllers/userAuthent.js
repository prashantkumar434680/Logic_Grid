const User = require('../Models/User');
const validate = require('../utils/Validate');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redisClient = require('redis');

const register = async (req,res) =>{
    try{
           // first check that the given details are correct or not
            validate(req.body);
            const [firstName,emailId,password] = req.body;
            req.body.password = bcrypt.hash(password,10);
            
           const user =  await User.create(req.body);
            const token = jwt.sign({_id:user._id,emailId:emailId},process.env.JWT_KEY,{expiresIn: 60*60});
            res.cookie('token',token,{maxAge: 60*60*1000});
            res.status(201).send("User Registred Sucessfully.");
    }
    catch(err){
        res.status(400).send("Error"+err);
    }

}

const login = async (req,res)=>{
    try{

    const {emailId,password} = req.body;
    // validate that given detais are vaild person details
    if(!emailId){
        throw new Error("Invalid Credentials.");
    }

    if(!password){
        throw new Error("Invalid Credentials.");
    }
    const user = User.findOne(emailId);
    const match = bcrypt.hash(req.password,user.password);
    if(!match || !user){
        throw new Error("Invalid Credentials.")
    }

        const token = jwt.sign({_id:user._id,emailId:emailId},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
        res.status(201).send("User Loged in Sucessfully.");
    }

    catch(err){
        res.status(400).send("Error"+err);
    }
}

const logout = async (req,res)=>{
    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);

        redisClient.set(`token:${token},'Blocked'`);
        redisClient.expiresIn(`token:${token}`,payload.exp);

        res.cookie("token",null,{expires:new Date(Date.now)});
        res.send("Logout sucessfully.");
    }
    catch(err){
        res.send("Error: "+err);
    }
}

const adminRegister = async (req,res)=>{
    try{
            // first validate the given details that these are correct or not
    validate(req.body);
    const {firstName, emailId,password} = req.body;
    const hash_pass = bcrypt.hash(password,10);
    req.body.password = hash_pass;

    const user = await User.create(req.body);
    const token = jwt.sign({_id:user._id,emailId:emailId,role:user.role},process.env.JWT_KEY,{expiresIn:60*60});
    res.cookies('token',token,{maxAge: 60*60*1000});

    res.send("Admin user Registred sucessfully.");
    }
    
    catch(err){
        res.send("Error: "+err);
    }
}

module.exports = {register,login,logout,adminRegister};