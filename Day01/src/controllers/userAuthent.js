const User = require('../Models/User');
const validate = require('validate');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const register = async (req,res) =>{
    try{
           // first check that the given details are correct or not
            validate(req.body);
            const [firstName,emailId,password] = req.body;
            req.body.password = bcrypt.hash(password,10);
            
            const token = jwt.sign({_id:user._id,emailId:emailId},process.env.JWT_KEY,{expiresIn: 60*60});
            res.cookie('token',token,{maxAge: 60*60*1000});
            await User.create(req.body);
            res.status(201).send("User Registred Sucessfully.");
    }
    catch(err){
        res.status(400).send("Error"+err);
    }

}

const login = (req,res)=>{
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