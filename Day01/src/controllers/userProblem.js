const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../Models/Problem")

const createProblem = async (req,res)=>{

    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
       
      for(const {language,completeCode} of referenceSolution){
        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);

      //  console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }


      // We can store it in our DB

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
        // console.log("these are submission ",err);
    }
}

const updateProblem = async (req,res)=>{
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
  } = req.body;

  try{
    if(!id){
      return res.status(400).send("ID is missing Field");
    }

    const DsaProblem = await Problem.findById(id);
    if(!DsaProblem){
      return res.status(404).send("ID is not present in DB");
    }

    for(const {language,completeCode} of referenceSolution){
      const languageId = getLanguageById(language);
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
        source_code:completeCode,
        language_Id:languageId,
        stdin:testcase.input,
        expected_output:testcase.output
      }));

      const submitResult = await submitBatch(submissions);
      const resultToken = await submitToken(submitResult.map((value)=> value.token));

      const testResult = await submitToken(resultToken);

      for(const test of testResult){
        if(test.staus_id!=3){
          return res.status(400).send("Error Occured");
        }
      }
    }

    const newProblem = await Problem.findByIdAndUpdate(id, {...req.body},{runValidators:true,new:true});
    res.status(200).send(newProblem);
  }
  catch(err){
    res.status(400).send("Error:" +err.message);
  }
}

// con/

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}

// const GetProblem = async (req,res)=>{
//   try{
//     const {id} = req.params;

//     if(!id){
//       res.status(400).send("ID is Missing");
//     }
//     const problem = await Problem.findById(id);

//     if(!problem){
//       res.status(404).send("Problem is not found in Db");
//     }
//     res.status(200).send(problem);
//   }
//   catch(err){
//     res.status(500).send("Error: "+err.message);
//   }
// }

const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id);

   if(!getProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

//  find all problems that are present in our Db and send it to frontend
// const allProblem = async (req,res)=>{
//   try{
//    const allProblem = await Problem .find({});

//    if(allProblem.length==0){
//     return res.status(404).send("There is not Problem in DB");
//    }
//    res.status(200).send(allProblem);
//   }
//   catch(err){
//     res.status(400).send("Error: "+err.message);
//   }
// }

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({});

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}





module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem};


