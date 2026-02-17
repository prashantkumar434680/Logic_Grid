const axios = require('axios');

const getLanguageById = (lang)=>{

    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }

    return language[lang.toLowerCase()];
}

const submitBatch = async (submissions)=>{

    
const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'true'
  },
  headers: {
    'x-rapidapi-key': 'ab99c6ec42mshfd636ec7c6687efp1b9043jsna684835b0591',
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    submissions
  }
};

async function fetchData(){
    try{
        const response = await axios.request(option);
        return response.data;
    }
    catch(err){
        throw new Error("Error: "+err);
    }
}

return await fetchData();
}


const waiting = async(timer)=>{
  setTimeout(()=>{
    return 1;
  },timer);
}

// now we have token we should submit these tokens these token will return in an array in string format
// ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","db54881d-bcf5-4c7b-a2e3-d33fe7e25de7"]

const submitToken = async(resultToken)=>{
  const options = {
  method: 'POST',
  url: 'https://judge0-extra-ce.p.rapidapi.com/submissions/batch',
  params:{
    tokens:resultToken.join(","),
    base64_encoded:'false',
    fiels:'*'
  },
  headers: {
    'x-rapidapi-key': '3e63377acdmsh2fc4e18d12d27d8p1f20cbjsn27974c65361d',
    'x-rapidapi-host': 'judge0-extra-ce.p.rapidapi.com',
  },
};

async function fetchData(){
  try{
    const response = await axios.request(options);
    return response.data;
  }
  catch(err){
    throw new Error("Error: ",err);
  }
}

while(true){
  const result = await fetchData();

  const IsResultObtained = result.submissions.every((r)=>r.status_id>2);

  if(IsResultObtained){
    return result.submissions;
  }

  await waiting(1000);
}

}

module.exports = {getLanguageById,submitBatch,submitToken};