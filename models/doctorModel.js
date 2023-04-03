const mongoose=require("mongoose");
const {ObjectId}=mongoose.Schema
const doctorSchema=new mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        default:"pending"
    },
    details:{
        type:String,
        required:true
    },
    appointment:[
        {
        type:ObjectId,
        ref:"Time"
    }
]
},{timestamps:true})

const doctorModel = mongoose.model("Doctor", doctorSchema);
module.exports = doctorModel;