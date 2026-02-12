const mongoose = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
    firstName:{
        type:String,
        minLength:5,
        maxLength:20,
        required:true
    },
    lastName:{
        type:String,
        minLength:5,
        maxLength:20,
        required:true
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        immutable:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true,
        min:6,
        max:80
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    problemSolved:{
        type:Number,
    },
    
},{timestamps:true})

const User = mongoose.model('user',UserSchema);
module.exports = User;