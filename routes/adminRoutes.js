const express=require("express");
const router=express.Router();
const User=require("../models/userModel");
const Doctor=require("../models/doctorModel")
const authMiddleware=require("../middlewares/authMiddleware");

router.post("/get-all-doctors",authMiddleware,async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.userId})
        if(user.role===2)
        {
            const doctors=await Doctor.find().populate("userId","firstName lastName")
            return res.status(200).send({success:true,message:"doctors fetched successfully",sucess:true,data:doctors})
        }
        return res.status(200).send({success:false,message:"restricted not admin"})

    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({
            message:"error getting all doctors",
            success:false
        })
    }
})


router.post("/get-all-users",authMiddleware,async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.userId})
        if(user.role===2)
        {
            const users=await User.find({role:0})
            return res.status(200).send({success:true,message:"users fetched successfully",sucess:true,data:users})
        }
        return res.status(200).send({success:false,message:"restricted not admin"})

    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({
            message:"error getting all users",
            success:false
        })
    }
})


module.exports=router;
