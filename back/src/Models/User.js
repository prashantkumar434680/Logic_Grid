const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type: String,
        required: true,
        minLength:3,
        maxLength:20
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20,
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim: true,
        lowercase:true,
        immutable: true,
    },
    verifyotp:{
        type:String
    },
    verifyotpExpireAt: {
        type: Number, default:0
    },
    isAccountVerified:{type: Number, default: false},
    verificationToken:{
        type:String
    },
    resetOtp:{ type:String, default:''},
    resetOtpExpireAt:{type:Number, default:0},
    verificationTokenExpires:{
        type:Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    googleId: {
       type: String
    },
    githubId: {
       type: String
    },
    avatar: {
       type: String
    },
    bio: {
       type: String,
       maxLength: 200
    },
    googleId: {
       type: String
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default: 'user'
    },
    problemSolved:{
        type:[String]
    },
    password:{
        type:String,
        required: true,
        select:false
    }
},{
    timestamps:true
});

userSchema.post('findOneAndDelete', async function (userInfo){
    if(userInfo){
        await mongoose.model('submission').deleteMany({userId:userInfo._id});
    }
})

const User = mongoose.model("user",userSchema);

module.exports = User;
