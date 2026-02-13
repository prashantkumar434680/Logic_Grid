const mongoose = require('mongoose');
const {Schema} = mongoose;

const ProblemSchema = new Schema({
   title:{
    type:String,
    required:true
   },
   description:{
    type:String,
    required:true,
    minLength:2
   },
   difficulty:{
    type:String,
    enum:['Easy','Medium','Hard'],
    required:true
   },
   tag:{
    type:String,
    enum:['Array','LinkedList','Graph','Tree','Dp'],
    required:true
   },
   visibletestCases:[
    {
        input:{
        type:String,
        required:true
        },
        output:{
        type:String,
        required:true
        },
        explenation:{
            type:String,
            required:true
        }
    }
   ],
   hiddenTestCases:[
    {
        input:{
            type:String,
            required:true
        },
        output:{
            type:String,
            required:true
        }
    }
   ],
   startCode:[
    {
        language:{
            type:String,
            required:true
        },
        initialCode:{
            type:String,
            required:true
        }
    }
   ],
   problemCreator:{
    type:Schema.Types.ObjectId,
    ref:'user',
    required:true
   }
})

const Problem = mongoose.model('Problem',ProblemSchema);

module.exports = Problem;