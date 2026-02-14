const {getLanguageById,submitBatch} = require("../utils/problemUtility");

const createProblem = async (req,res)=>{

    try{
      const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCraetor
      } = req.body;

      for(const {language, completeCode} of referenceSolution){
       
        const languageId = getLanguageById(language);
        // Now we will submit the Btach Submission
        const submissions = visibleTestCases.map((input,output)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: input,
            expected_output: output
        }));

        const submitResult = await submitBatch(submissions);
      }
    }
    catch(err)
    {
        res.send("Error: "+err);
    }
}