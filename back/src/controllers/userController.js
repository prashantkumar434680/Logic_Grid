const User = require('../Models/User');

const getUserData = async (req,res)=>{
    try{
         const {_id} = req.result;
         const user = await User.findById(_id);
    if(!user){
        res.json({success:false, message:"User Not Found"});
    }
        res.json({
            success:true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName || "",
                emailId: user.emailId,
                avatar: user.avatar || null,
                avatarPublicId: user.avatarPublicId || null,
                bio: user.bio || "",
                age: user.age ?? null,
                role: user.role,
                isAccountVerified: user.isAccountVerified
            }
        }); 
    }
catch(err){
    res.json({success:false, message:"Error: "+err.message});
}
}

module.exports = {getUserData};
