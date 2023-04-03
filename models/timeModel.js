const mongoose=require("mongoose")
const timeSchema=new mongoose.Schema({
    to:
    {
        type:String,
        required:true
    },
    from:{
        type:String,
        required:true
    }
})

const timeModel=mongoose.model("Time",timeSchema);
module.exports=timeModel;