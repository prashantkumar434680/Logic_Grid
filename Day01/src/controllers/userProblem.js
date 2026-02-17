const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../Models/Problem");
require('dotenv').config();
const createProblem = async (req,res)=>{

    try{
      const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCraetor
      } = req.body;

      for(const {language, completeCode} of referenceSolution){
       
        const languageId = getLanguageById(language);
        // Now we will submit the Btach Submission
        const submissions = visibleTestCases.map((value)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: value.input,
            expected_output: value.output
        }));

        const submitResult = await submitBatch(submissions);

        // now we will take every token one by one and check that it is correct or not
        const resultToken = submitResult.map((value)=>value.token);
        const testResult = await submitToken(resultToken);

        for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }

       const userProblem =  await Problem.create({
              ...req.body,
              problemCreator: req.result._id
            });
      
            res.status(201).send("Problem Saved Successfully");
    }
    catch(err)
    {
        res.status(400).send("Error: "+err);
    }
}

module.exports = {createProblem};