const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
    await mongoose.connect(process.env.STRING)
    // console.log("hello DB.");
}

module.exports = main;