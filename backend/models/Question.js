const mongoose=require("mongoose");

const questionSchema =new mongoose.Schema({
    session:{type:mongoose.Schema.Types.ObjectId,ref:"Session"},
    question: String,
    answer:String,
    note:String,
    isPinned:{type:Boolean,default:false},
    userAnswer:{type:String,default:null},
    evaluation:{
        score:{type:Number,default:null},
        strengths:[String],
        weaknesses:[String],
        missingConcepts:[String],
        feedback:{type:String,default:null},
        idealAnswer:{type:String,default:null},
    },
    score:{type:Number,default:null},
    isAnswered:{type:Boolean,default:false},
},{timestamps :true});

module.exports=mongoose.model("Question",questionSchema);

// relation between question and session
// It is a one-to-many relationship:
// One Session can have many Questions.
// Each Question belongs to exactly one Session.
// This relationship is implemented using an ObjectId
//  reference in the Question schema.