const express = require('express');
const Airouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const solveDoubt = require("../controllers/solveDoubt");


Airouter.post('/Chat',userMiddleware,solveDoubt);

module.exports = Airouter;