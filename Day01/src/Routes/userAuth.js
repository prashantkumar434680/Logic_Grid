const express = require('express');
const authRouter = express.Router();

// Register
authRouter.post('/register',register);
authRouter.post('login',login);
authRouter.get('getprofile',getprofile);
authRouter.post('logout',logout);

export default userAuth;