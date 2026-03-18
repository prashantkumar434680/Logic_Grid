const redisClient = require("../config/redis");
const User =  require("../Models/User")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const transporter = require('../config/nodemailer');

const register = async (req,res)=>{
    
    try{
        // validate the data;

    console.log(req.body)
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
    }
    
     res.cookie('token',token,{maxAge: 60*60*1000});
     await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: emailId,
        subject: "Welcome to LogicGrid",
        text: `Hello ${firstName},\n\nWelcome to LogicGrid. Your account has been created successfully.`
     });
     res.status(201).json({
        user:reply,
        message:"Register sucessfully Successfully"
    })
    }
    catch(err){
        console.log(err);
        res.status(400).send("Error: "+err);
    }
}

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendVerifyOtp = async (req,res)=>{
    try{
        const {_id, firstName, emailId} = req.result;

        const user = await User.findById(_id);
        if(!user){
            return res.status(404).send("Error: User Doesn't Exist");
        }

        const otp = generateOTP();
        user.verifyotp = otp;
        user.verifyotpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: emailId,
            subject: "Account Verification OTP for LogicGrid",
            text: `Hello ${firstName},\n\nYour OTP for account verification is ${otp}.`
        });

        res.status(200).json({
            message: "OTP Sent Successfully"
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send("Error: "+err);
    }
}

const verifyEmail = async (req,res)=>{
    try{
        const {otp} = req.body;
        const {_id} = req.result;

        const user = await User.findById(_id);
        if(!user){
            return res.status(404).send("Error: User Doesn't Exist");
        }

        if(user.verifyotp !== otp){
            return res.status(400).send("Error: Invalid OTP");
        }

        if(user.verifyotpExpireAt < Date.now()){
            return res.status(400).send("Error: OTP Expired");
        }

        user.isAccountVerified = true;
        user.verifyotp = '';
        user.verifyotpExpireAt = 0;
        await user.save();

        res.status(200).json({
            message: "Account Verified Successfully"
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send("Error: "+err);
    }
}

const sendResetOtp = async (req,res)=>{
    try{
        const {emailId} = req.body;

        if(!emailId){
            return res.status(400).send("Error: Email is Required");
        }

        const user = await User.findOne({emailId});
        if(!user){
            return res.status(404).send("Error: User Doesn't Exist");
        }

        const otp = generateOTP();
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: emailId,
            subject: "Password Reset OTP for LogicGrid",
            text: `Hello ${user.firstName},\n\nYour password reset OTP is ${otp}. It is valid for 15 minutes.`
        });

        res.status(200).json({
            message: "Reset OTP Sent Successfully"
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send("Error: "+err);
    }
}

const resetPassword = async (req,res)=>{
    try{
        const {emailId, otp, password} = req.body;

        if(!emailId || !otp || !password){
            return res.status(400).send("Error: Missing Details");
        }

        const user = await User.findOne({emailId}).select('+password');
        if(!user){
            return res.status(404).send("Error: User Doesn't Exist");
        }

        if(user.resetOtp !== otp){
            return res.status(400).send("Error: Invalid OTP");
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.status(400).send("Error: OTP Expired");
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();

        res.status(200).json({
            message: "Password Reset Successfully"
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send("Error: "+err);
    }
}


const login = async (req,res)=>{

    try{
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId}).select('+password');

        if(!user)
            throw new Error("Invalid Credentials");

        const match = await bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role:user.role,
        }

        const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
        res.status(200).json({
            user:reply,
            message:"Loggin Successfully"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register, sendVerifyOtp, verifyEmail, sendResetOtp, resetPassword, login,logout,adminRegister,deleteProfile};
