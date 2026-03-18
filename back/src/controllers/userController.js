const User = require('../Models/User');

const getUserData = async (req,res)=>{
    try{
         const {_id} = req.result;
         const user = await User.findById(_id);
    if(!user){
        res.json({success:false, message:"User Not Found"});
    }
        res.json({success:true, name:user.firstName,isAccountVerified:user.isAccountVerified}); 
    }
catch(err){
    res.json({success:false, message:"Error: "+err.message});
}
}

module.exports = {getUserData};