const mongoose=require("mongoose");

const sessionSchema=new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    role:{type:String,required:true},
    experience:{type:String,required:true},
    topicsToFocus:{type:String,required:true},
    description:String,
    numberOfQuestions:Number,
    questions:[{type:mongoose.Schema.Types.ObjectId,
        ref:"Question"}],
    mode:{type:String,enum:["practice","mock"],default:"practice"},
    status:{type:String,enum:["in_progress","completed"],default:"in_progress"},
    overallScore:{type:Number,default:null},
},{timestamps:true});

module.exports=mongoose.model("Session",sessionSchema);