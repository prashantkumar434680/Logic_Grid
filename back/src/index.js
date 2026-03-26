const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRouter = require('./Routes/userAuth');
const redisClient = require('./config/redis');
const problemRouter = require('./Routes/ProblemCreator');
const submitRouter = require('./Routes/submit');
const userDataRouter = require('./Routes/userData');
const passport = require('./config/passport');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

app.use('/user',authRouter);
app.use('/submission',submitRouter);
app.use('/problem',problemRouter);
app.use('/userData',userDataRouter);


const InitalizeConnection = async()=>{
    try{
        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected.");

        app.listen(process.env.PORT,()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })
    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();

