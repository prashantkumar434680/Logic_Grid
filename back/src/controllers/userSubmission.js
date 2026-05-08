const Problem = require("../Models/Problem");
const Submission = require("../Models/submission");
const User = require("../Models/User");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const { isSameUTCDate, getUTCStartOfDay } = require('../utils/dailyProblemScheduler');

const getSubmissionCalendar = async (req, res) => {
  try {
    const userId = req.result._id;
    const daysRaw = Number(req.query.days);
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(366, Math.floor(daysRaw)) : 364;

    const now = new Date();
    const endUTC = getUTCStartOfDay(now);
    const fromUTC = new Date(endUTC.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const counts = await Submission.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: fromUTC, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: "$_id", count: 1 } },
      { $sort: { date: 1 } },
    ]);

    return res.status(200).json({
      days,
      from: fromUTC,
      to: now,
      counts,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch submission calendar' });
  }
};

const submitCode = async (req,res)=>{
   
    // 
    try{
      
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).json({ message: "Some field missing" });
      

      if(language==='cpp')
        language='c++'
      
      // console.log(language);
      
    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
       if(!problem)
        return res.status(404).json({ message: "Problem not found" });

      if (problem.isDailyProblem) {
        const todayStart = getUTCStartOfDay();
        if (!problem.activeDate || !isSameUTCDate(problem.activeDate, todayStart)) {
          return res.status(403).json({ message: 'Daily problem has expired. Submissions are closed.' });
        }
      }
    //    testcases(Hidden)
    
    //   Kya apne submission store kar du pehle....
    // console.log("Hello");
    if(!problem.hiddenTestCases?.length)
      return res.status(400).json({ message: "No hidden test cases found for this problem" });

    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
     })
// console.log(submittedResult);
    //    Judge0 code ko submit karna hai
    
    const languageId = getLanguageById(language);
    // console.log(languageId);
   
    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    
    const submitResult = await submitBatch(submissions);
    // console.log(submitResult);
    
    const resultToken = submitResult.map((value)=> value.token);
    // console.log(resultToken);
    const testResult = await submitToken(resultToken);
    // console.log(testResult);
    

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'error'
            errorMessage = test.stderr
          }
          else{
            status = 'wrong'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
    
    // ProblemId ko insert karenge userSchema ke problemSolved mein if it is not persent there.
    
    // req.result == user Information

    const accepted = (status == 'accepted')
    const alreadySolved = (req.result.problemSolved || []).some(
      (id) => id.toString() === problemId
    );

    if(accepted && !alreadySolved){
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }

    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
       
    }
    catch(err){
      res.status(500).json({ message: err.message || `Internal Server Error: ${err}` });
    }
}


const runCode = async(req,res)=>{
    
     // 
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      let {code,language} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).json({ message: "Some field missing" });

   //    Fetch the problem from database
      const problem =  await Problem.findById(problemId);
      if(!problem)
       return res.status(404).json({ message: "Problem not found" });

      if (problem.isDailyProblem) {
        const todayStart = getUTCStartOfDay();
        if (!problem.activeDate || !isSameUTCDate(problem.activeDate, todayStart)) {
          return res.status(403).json({ message: 'Daily problem has expired. Run is disabled.' });
        }
      }
   //    testcases(Hidden)
      if(language==='cpp')
        language='c++'

      if(!problem.visibleTestCases?.length)
       return res.status(400).json({ message: "No visible test cases found for this problem" });

   //    Judge0 code ko submit karna hai

   const languageId = getLanguageById(language);

   const submissions = problem.visibleTestCases.map((testcase)=>({
       source_code:code,
       language_id: languageId,
       stdin: testcase.input,
       expected_output: testcase.output
   }));


   const submitResult = await submitBatch(submissions);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = false
            errorMessage = test.stderr
          }
          else{
            status = false
            errorMessage = test.stderr
          }
        }
    }

   
  
   res.status(201).json({
    success:status,
    testCases: testResult,
    runtime,
    memory
   });
      
   }
   catch(err){
     res.status(500).json({ message: err.message || `Internal Server Error: ${err}` });
   }
}


module.exports = {submitCode,runCode,getSubmissionCalendar};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',


// User.findByIdUpdate({
// })

//const user =  User.findById(id)
// user.firstName = "Mohit";
// await user.save();
