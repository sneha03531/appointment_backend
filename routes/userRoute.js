const express=require('express');
const router=express.Router();
const bcrypt=require("bcryptjs");
const axios = require("axios")
const jwt = require("jsonwebtoken")
const config = require("config")
const User=require("../models/userModel");
const authMiddleware=require("../middlewares/authMiddleware");

router.post("/register",async(req,res)=>{
try{
        if(req.body.googleAccessToken){
            const {googleAccessToken} = req.body;
            axios.get("https://www.googleapis.com/oauth2/v3/userinfo",{
            headers: {
                "Authorization": `Bearer ${googleAccessToken}`
            }
        })
        .then(async response=>{
            const firstName = response.data.given_name;
            const lastName = response.data.family_name;
            const email = response.data.email;
            const picture = response.data.picture;
            const existingUser = await User.findOne({email})
            if (existingUser) 
                return res.status(400).json({message: "User already exist!"})

            const result = await User.create({verified:"true",email, firstName, lastName, profilePicture: picture})
            const token = jwt.sign({
                email: result.email,
                id: result._id
            },process.env.SECRET, {expiresIn: "1h"})
            res.status(200).json({result, token,success:true,message:"successfully signed up!"})
             
            })
            .catch(err => {
                res.status(400).json({message: "Invalid access token!"})
            })  
        }
        else {
            const {email, password, firstname, lastname} = req.body;
            
            try {
                if (email === "" || password === "" || firstname === "" || lastname === "" && password.length <= 4) 
                    return res.status(400).json({message: "Invalid field!"})
    
                const existingUser = await User.findOne({email})
    
                if (existingUser) 
                    return res.status(400).json({message: "User already exist!"})

                   
    
                const hashedPassword = await bcrypt.hash(password, 12)
    
                const result = await User.create({email, password: hashedPassword, firstName: firstname, lastName: lastname})
                
    
                const token = jwt.sign({
                    email: result.email,
                    id: result._id
                },process.env.SECRET, {expiresIn: "1h"})
    
                    res
                    .status(200)
                    .json({result, token,success:true,message:"successfully signed up!"})
            } catch (err) {
                    res
                    .status(500)
                    .json({message: "Something went wrong!",success:false})
            }
        }
}
catch(err)
{
    return res.status(500).send({message:"error creating user",success:false});
}
})

router.post("/login",async(req,res)=>{
    try{

        if(req.body.googleAccessToken){
            // gogole-auth
            const {googleAccessToken} = req.body;
    
            axios
                .get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                    "Authorization": `Bearer ${googleAccessToken}`
                }
            })
                .then(async response => {
                    const email = response.data.email;
                    const existingUser = await User.findOne({email})
    
                    if (!existingUser) 
                    return res.status(404).json({message: "User don't exist!",success:false})
    
                    const token = jwt.sign({
                        email: existingUser.email,
                        id: existingUser._id
                    },process.env.SECRET, {expiresIn: "1h"})
            
                    res
                        .status(200)
                        .json({result: existingUser, token,success:true,message:"successfully signed in!"})
                        
                })
                .catch(err => {
                    res
                        .status(400)
                        .json({message: "Invalid access token!"})
                })
        }else{
            // normal-auth
            const {email, password} = req.body;
            if (email === "" || password === "") 
                return res.status(400).json({message: "Invalid field!"});
            try {
                const existingUser = await User.findOne({email})
        
                if (!existingUser) 
                    return res.status(404).json({message: "User don't exist!"})
        
                const isPasswordOk = await bcrypt.compare(password, existingUser.password);
        
                if (!isPasswordOk) 
                    return res.status(400).json({message: "Invalid credintials!"})
        
                const token = jwt.sign({
                    email: existingUser.email,
                    id: existingUser._id
                }, process.env.SECRET, {expiresIn: "1h"})
        
                res
                    .status(200)
                    .json({result: existingUser, token,success:true,message:"successfully signed in!"})
            } catch (err) {
                res
                    .status(500)
                    .json({message: "Something went wrong!",success:false})
            }
        }

    }catch(err){
        return res.status(500).send({message:"error creating user",success:false});
    }
});

router.post("/get-user-by-id",authMiddleware,async(req,res)=>{
    try {
        const user=await User.findOne({_id:req.userId})
        if(!user)
        {
            return res.status(200).send({message:"user does not exists"})
        }
        else{
            return res.status(200).send({success:true,data:user})
        }
    }
    catch(err)
    {
        return res.status(500).send({message:"something went wrong",success:false})
    }
})

//route to mark notification as seen
router.post("/mark-all-notifications-as-seen",authMiddleware,async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.body.userId})
        console.log(req.body.userId)
        const unseenNotifications=user.unseenNotifications
        user.seenNotifications=unseenNotifications
        user.unseenNotifications=[]
        const updateUser=await User.findByIdAndUpdate(user._id,user);
        updateUser.password=undefined;
        res.status(200).send({success:true,message:"all notifications cleared",data:updateUser})

    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({message:"error in clearing notifications"})
    }
})

router.post("/delete-all-notifications",authMiddleware,async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.body.userId})
        user.seenNotifications=[]
        user.unseenNotifications=[]
        const updateUser=await User.findByIdAndUpdate(user._id,user);
        updateUser.password=undefined;
        res.status(200).send({success:true,message:"all notifications cleared",data:updateUser})

    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({message:"error in clearing notifications"})
    }
})

module.exports=router;