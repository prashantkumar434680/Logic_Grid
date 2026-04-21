const express = require('express');

const problemRouter =  express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    createProblem,
    updateProblem,
    deleteProblem,
    getProblemById,
    getAllProblem,
    solvedAllProblembyUser,
    submittedProblem,
    getDailyProblem,
    rotateDailyProblemNow,
    searchProblems,
} = require("../controllers/userProblem");
const userMiddleware = require("../middleware/userMiddleware");


// Create
problemRouter.post("/create" ,adminMiddleware,createProblem);
problemRouter.put("/update/:id",adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware, deleteProblem);
problemRouter.get("/test",adminMiddleware, (req,res)=>{
    res.status(200).send("Admin Middleware is working");
});

problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
problemRouter.get('/search', userMiddleware, searchProblems);
problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
problemRouter.get('/daily', userMiddleware, getDailyProblem);
problemRouter.get("/problemSolvedByUser",userMiddleware, solvedAllProblembyUser);
problemRouter.get('/submittedProblem/:pid',userMiddleware,submittedProblem);
problemRouter.post('/daily/rotate', adminMiddleware, rotateDailyProblemNow);


module.exports = problemRouter;

