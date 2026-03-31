const redisClient = require("../config/redis");
const User =  require("../Models/User")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const transporter = require('../config/nodemailer');

const register = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, emailId, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...req.body,
      password: hashedPassword,
      role: "user",
      isAccountVerified: false,
    });

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: 'user' },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    user.verifyToken = token;
    user.verifyTokenExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Create verification link - using path parameter instead of query
    const verificationLink = `${process.env.BASE_URL}/user/verify-email/${token}`;

    try {
      // Send verification email
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: emailId,
        subject: "Verify your account - LogicGrid",
        html: `
          <h2>Welcome to LogicGrid!</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering. Please click the link below to verify your account:</p>
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Account</a>
          <p>Or copy and paste this link: ${verificationLink}</p>
          <p>This link will expire in 15 minutes.</p>
        `,
        text: `Hello ${firstName},

Thank you for registering. Click the link below to verify your account:

${verificationLink}

This link will expire in 15 minutes.
        `,
      });
    } catch (emailError) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      console.log("Email sending failed:", emailError);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again."
      });
    }

    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role,
        isAccountVerified: user.isAccountVerified
      }
    });

  } catch (err) {
    console.log("Registration error:", err);
    res.status(400).json({
      message: err.message || "Registration failed"
    });
  }
};

// const register = async (req,res)=>{
    
//     try{
//         // validate the data;

//     console.log(req.body)
//       validate(req.body); 
//       const {firstName, emailId, password}  = req.body;

//       req.body.password = await bcrypt.hash(password, 10);
//       req.body.role = 'user'
//     //
    
//      const user =  await User.create(req.body);
//      const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
//      const reply = {
//         firstName: user.firstName,
//         emailId: user.emailId,
//         _id: user._id,
//         role:user.role,
//     }
    
//      res.cookie('token',token,{maxAge: 60*60*1000});
//      await transporter.sendMail({
//         from: process.env.SENDER_EMAIL,
//         to: emailId,
//         subject: "Welcome to LogicGrid",
//         text: `Hello ${firstName},\n\nWelcome to LogicGrid. Your account has been created successfully.`
//      });
//      res.status(201).json({
//         user:reply,
//         message:"Register sucessfully Successfully"
//     })
//     }
//     catch(err){
//         console.log(err);
//         res.status(400).send("Error: "+err);
//     }
// }

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendVerificationLink = async (req, res) => {
  try {
    const { _id, firstName, emailId } = req.result;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send("Error: User Doesn't Exist");
    }

    if (user.isAccountVerified)
    return res.status(400).send("User already verified");

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiry (15 minutes)
    user.verifyToken = token;
    user.verifyTokenExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Create verification link
    const verificationLink = `${process.env.BASE_URL}/user/verify-email?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: emailId,
      subject: "Verify Your Account - LogicGrid",
      text: `Hello ${firstName},

Click the link below to verify your account:

${verificationLink}

This link will expire in 15 minutes.
`,
    });

    res.status(200).json({
      message: "Verification link sent successfully",
    });

  } catch (err) {
    console.log(err);
    res.status(400).send("Error: " + err);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    // console.log("Verification attempt with token:", token);

    if (!token) {
      return res.status(400).json({
        message: "Invalid or missing verification token"
      });
    }

    // Find user with this token
    const user = await User.findOne({ 
      verifyToken: token,
      verifyTokenExpireAt: { $gt: Date.now() }
    });

    if (!user) {
      // Try to find user with token but check if expired
      const expiredUser = await User.findOne({ verifyToken: token });
      if (expiredUser) {
        // console.log("Token found but expired");
        return res.status(400).json({
          message: "Verification token has expired. Please request a new verification email."
        });
      }
      
    //   console.log("No user found with this token");
      return res.status(400).json({
        message: "Invalid verification token"
      });
    }

    // Verify account
    user.isAccountVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpireAt = undefined;

    await user.save();
    // console.log("User verification status after save:", user.isAccountVerified);

    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

  } catch (err) {
    // console.log("Email verification error:", err);
    res.status(500).json({
      message: "Server error during email verification"
    });
  }
};

// ── Step 1: Send reset OTP ────────────────────────────────────────────
const sendResetOtp = async (req, res) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(200).json({ message: "If this email exists, OTP has been sent" });
    }

    if (user.resetOtpExpireAt && user.resetOtpExpireAt - Date.now() > 4 * 60 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another OTP" });
    }

    const otp   = generateOTP();
    const token = jwt.sign(
      { emailId: user.emailId, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: 5 * 60 } 
    );

    user.resetOtp                  = otp;
    user.resetOtpExpireAt          = Date.now() + 5 * 60 * 1000;       // ✅ timestamp not duration
    user.resetPasswordToken        = token;
    user.resetPasswordTokenExpires = Date.now() + 5 * 60 * 1000;       // ✅ timestamp not duration
    await user.save();

    await transporter.sendMail({
      from:    process.env.SENDER_EMAIL,
      to:      emailId,
      subject: "Password Reset OTP - LogicGrid",
      text:    `Hello ${user.firstName},\n\nYour password reset OTP is: ${otp}\n\nExpires in 5 minutes.\n\nIgnore if you didn't request this.`,
    });

    res.cookie('resetToken', token, {
      maxAge:   5 * 60 * 1000,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: "If this email exists, OTP has been sent" });

  } catch (err) {
    console.error("sendResetOtp error:", err);
  }
};


const verifyResetOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const token = req.cookies.resetToken;
    if (!token) {
      return res.status(400).json({ message: "Reset session expired. Please request a new OTP." });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        message: err.name === 'TokenExpiredError'
          ? "OTP session expired. Please request a new one."
          : "Invalid reset session."
      });
    }

    const { emailId } = payload;

    if (!emailId || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.resetOtp         = null;
    user.resetOtpExpireAt = null;
    await user.save();

    const resetToken = jwt.sign(
      { emailId: user.emailId, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: 10 * 60 }
    );

    res.cookie('resetToken', resetToken, {
      maxAge:   10 * 60 * 1000,
      httpOnly: true
    });

    res.status(200).json({ message: "OTP verified successfully" });

  } catch (err) {
    console.error("verifyResetOTP error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const token = req.cookies.resetToken;
    if (!token) {
      return res.status(400).json({ message: "Reset session expired. Please start again." });
    }
     
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const strongPassword = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, number and symbol",
      });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log("Password reset for user:", hashedPassword);
    user.password                  = hashedPassword;
    user.resetPasswordToken        = null;
    user.resetPasswordTokenExpires = null;
    await user.save();

    res.clearCookie('resetToken');

    res.status(200).json({ message: "Password reset successfully" });

  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

        // Check if account is verified
        if (!user.isAccountVerified) {
            return res.status(401).json({
                message: "Please verify your email before logging in. Check your inbox for the verification link."
            });
        }

        const match = await bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        }

        const token = jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
        res.status(200).json({
            user:reply,
            message:"Login Successfully"
        })
    }
    catch(err){
        res.status(401).json({
            message: err.message || "Invalid Credentials"
        });
    }
}


const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....
    // res.clearCookie("refreshToken"); 
    // or
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



const resendVerification = async (req, res) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.isAccountVerified) {
      return res.status(400).json({
        message: "Account is already verified"
      });
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    
    user.verifyToken = token;
    user.verifyTokenExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    await user.save();

    // Create verification link
    const verificationLink = `${process.env.BASE_URL}/user/verify-email/${token}`;

    try {
      // Send verification email
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: emailId,
        subject: "Verify your account - LogicGrid (Resent)",
        html: `
          <h2>Email Verification</h2>
          <p>Hello ${user.firstName},</p>
          <p>Please click the link below to verify your account:</p>
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Account</a>
          <p>Or copy and paste this link: ${verificationLink}</p>
          <p>This link will expire in 15 minutes.</p>
        `,
        text: `Hello ${user.firstName},

Please click the link below to verify your account:

${verificationLink}

This link will expire in 15 minutes.
        `,
      });

      res.status(200).json({
        message: "Verification email sent successfully"
      });

    } catch (emailError) {
      console.log("Email sending failed:", emailError);
      res.status(500).json({
        message: "Failed to send verification email"
      });
    }

  } catch (error) {
    console.log("Resend verification error:", error);
    res.status(500).json({
      message: "Server error while sending verification email"
    });
  }
};



module.exports = {verifyResetOTP,sendVerificationLink, verifyEmail, resendVerification, register, sendResetOtp, resetPassword, login,logout,adminRegister,deleteProfile};
