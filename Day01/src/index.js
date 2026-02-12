const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cookie = require('cookie-parser');

app.use(express.json())
app.use(cookie());

main()
.than(()=>{
    app.listen(process.env.PORT,()=>{
    console.log("Server is running at port " + process.env.PORT);
})
})
.catch(err=>console.log("Error has occured "+err));
