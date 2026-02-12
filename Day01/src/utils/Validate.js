const validator = require('validator');

const validate = (data)=>{
    const MendatoryFields = {firstName,emailId,password};
    const Allowed = MendatoryFields.every((k)=>Object.keys(data).includes(k));

    if(!Allowed){
        throw new Error("Some Important Fields is missing");
    }

    if(!validator.isEmail(data.emailId)){
        throw new Error("EmailId is Missing.");
    }

    if(!validator.isStrongPassword(data.password)){
        throw new Error("Please enter Strong Password.");
    }
}


module.exports = validate;