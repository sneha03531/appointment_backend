const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({

    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: false},
    profilePicture: {type: String, required: false},
    id: {type: String},
    role: {type:Number, default:0},
    seenNotifications:{
        type:Array,
        default:[]
    },
    unseenNotifications:{
        type:Array,
        default:[]
    }
},{
    timestamps: true
})

const userModel=mongoose.model('User',userSchema);
module.exports=userModel;