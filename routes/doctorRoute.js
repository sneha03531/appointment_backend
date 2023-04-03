const express=require('express');
const router=express.Router();
const bcrypt=require("bcryptjs");
const axios = require("axios")
const jwt = require("jsonwebtoken")
const config = require("config")
const User=require("../models/userModel");
const Doctor=require("../models/doctorModel");
const Time=require("../models/timeModel");
const authMiddleware=require("../middlewares/authMiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ObjectId = require('mongoose').Types.ObjectId;

  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "folder",
      format: async () => "png",
      public_id: (req, file) => {
        file.filename
      },
    },
  });
  
const parser = multer({ storage: storage });

router.post("/get-doctor-by-id",authMiddleware,parser.single("image"),async(req,res)=>{
    try {
        const user=await User.findOne({_id:req.userId})
        if(!user)
        {
            return res.status(200).send({message:"user does not exists"})
        }
        else{
            if(user.role!==1)
            {
                return res.status(200).send({message:"doctor does not exist"});
            }
            else
            {
              if(req.body.status==='' || req.file.path==='')
              {
                return res.status(200).send({message:"send all fields"})
              }
              const doct=await Doctor.findOne({userId:user._id});
              if(doct)
                {
                    return res.status(400).send({message:"doctor already exists"})
                }
                dd=await Doctor.create({userId:user._id,details:req.file.path,status:req.body.status})
                const admin=await User.findOne({role:2})
                const unseenNotifications=admin.unseenNotifications
                unseenNotifications.push({
                  type:"new-doctor-request",
                  
                  data:{
                    doctorId:dd._id,
                    name:user.firstName+" "+user.lastName
                  },
                  onClick:"/admin/doctors"
                })
                await User.findByIdAndUpdate(admin._id,{unseenNotifications})
                return res.status(200).send({data:dd,success:true,message:"created doctor"})
            }
       }
    }
    catch(err)
    {
        console.log(err)
        return res.status(500).send({message:"something went wrong",success:false})
    }
})

//route to edit status
router.put("/edit-status-doctor",authMiddleware,async(req,res)=>{
  try{
    const {status}=req.body;
    if(status==='')
    {
      return res.status(200).send({message:"put status",success:false})
    }

    const doct=await Doctor.findOneAndUpdate({userId:req.userId},{$set:{status}},{new:true})
  
      return res.status(200).send({message:"updated successfully",data:doct,success:true})
  }
  catch(err)
  {
    console.log(err)
    return res.status(500).send({message:"something went wrong",success:false})
  }
})

router.post("/get-doctor-info-by-userid",authMiddleware,async(req,res)=>{
  try{
    const doctor=await Doctor.findOne({userId:req.body.userId}).populate("userId","firstName lastName")
    return res.status(200).send({success:true,message:"doctor info fetched successfully",data:doctor})
  }catch(err)
  {
    console.log(err)
    return res.status(500).send({message:"error getting doctor info",success:false})
  }
})

router.post("/edit-doctor-details",authMiddleware,parser.single("image"),async(req,res)=>{
  try{
    const getDc=await Doctor.findOne({userId:req.userId})
    let flag=0;
    if(getDc.details===req.body.image)
    {
      flag=1
    }
    if(req.body.firstName || req.body.lastName)
    {
      getUser=await User.findOneAndUpdate({_id:req.userId},{$set:{
        firstName:req.body.firstName,
        lastName:req.body.lastName
      }},{new:true})
    }
    const getDoct=await Doctor.findOneAndUpdate({userId:req.userId},{$set:{
      status:req.body.status,
      details:flag===1 ? req.body.details : req.file.path 
    }},{new:true})

    const getnewDoct=await Doctor.findOne({userId:req.userId}).populate("userId","firstName lastName")
     return res.status(200).send({message:"updated successfully",data:getnewDoct,success:true})

  }catch(err)
  {
    console.log(err)
    return res.status(500).send({message:"failed to update",success:false})
  }
})

router.post("/create-timings",authMiddleware,async(req,res)=>{
   if(req.body.to && req.body.from)
   {
    const timeg=await Time.find();
    let tg="";
    if(timeg.length>0)
    {
      timeg.map((data)=>{
        if(data.from===req.body.from && data.to===req.body.to)
         {
           tg=data._id;
           return 0;
         }
      })
    }
    if(ObjectId.isValid(tg))
    {
      const newgetDoct=await Doctor.findOneAndUpdate({userId:req.userId},
        {
          $push:{appointment:tg}
        },
        {new:true})
        return res.status(200).send({success:true,message:"value placed",data:newgetDoct})
    }
    else
    {
      const newtg=await Time.create({verified:"true",to:req.body.to,from:req.body.from})
      const newgetDoct=await Doctor.findOneAndUpdate({userId:req.userId},
        {
          $push:{appointment:newtg._id}
        },
        {new:true})
        return res.status(200).send({success:true,message:"time created and value placed",data:newgetDoct})
    }
   }
   else{
    return res.status(500).send({message:"enter to and from for time create",success:false})
   }
})

router.post("/check-present-timings",authMiddleware,async(req,res)=>{
  try{
    const getDoct=await Doctor.findOne({userId:req.userId}).populate("appointment","to from")
    let flag=0;
    if(req.body.to && req.body.from)
    {
      const val=getDoct.appointment
      if(val.length>0)
      {
        val.map((data)=>{
           if(data.from===req.body.from && data.to===req.body.to)
           {
            flag=1;
            return 0;
           }
        })
      }
      if(flag==1)
      {
        return res.status(200).send({message:"already exixts",success:false})
      }
      else{
        return res.status(200).send({message:"not exixts",success:true})
      }
    }
    else{
      return res.status(200).send({message:"enter to and from",success:false})
    }

  }catch(err)
  {
    console.log(err)
    return res.status(500).send({message:"failed to create timings",success:false})
  }
})

//get all timings of doctor
router.post("/get-all-timings",authMiddleware,async(req,res)=>{
  try{
    const getDoct=await Doctor.findOne({userId:req.userId}).populate("appointment","to from");
    return res.status(200).send({message:"data fetched successfully",success:true,data:getDoct})
  }
  catch(err)
  {
    console.log(err)
    return res.status(500).send({message:"something went wrong",success:false})
  }
  


})

//pull timing from doctor
router.post("/delete-time",authMiddleware,async(req,res)=>{
  try{
    console.log(req.body)
   const deldata=await Doctor.findOneAndUpdate({userId:req.userId},{
    $pull:{appointment:req.body.dd}
   },{
    new:true
   })
   return res.status(200).send({message:"deleted successfully",success:true,data:deldata})
  }
  catch(err)
  {
    return res.status(500).send({message:"failed to delete",success:false})
  }
})

module.exports=router;