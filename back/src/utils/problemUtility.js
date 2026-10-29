const axios = require('axios');

const getLanguageById = (lang)=>{
    const clean = String(lang || '').trim().toLowerCase();
    const language = {
        "c++": 54,
        "cpp": 54,
        "java": 62,
        "javascript": 63,
        "js": 63,
        "python": 71,
        "python3": 71
    };
    return language[clean] || 63;
};

const submitBatch = async (submissions)=>{
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      base64_encoded: 'false'
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      submissions
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.log("these are submission ",error);
      throw new Error("Error: "+error.message);
    }
  }

  return await fetchData();
};

const waiting = (timer) => new Promise((resolve) => {
  setTimeout(resolve, timer);
});

const submitToken = async(resultToken)=>{
  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'false',
      fields: '*'
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || String(error));
    }
  }

  while(true){
    const result =  await fetchData();

    if (!result?.submissions) {
      throw new Error("Judge0 did not return submissions");
    }

    const IsResultObtained =  result.submissions.every((r)=>r.status_id>2);

    if(IsResultObtained)
      return result.submissions;

    await waiting(1000);
  }
};

module.exports = {getLanguageById,submitBatch,submitToken};
