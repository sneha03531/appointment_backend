const jwt = require("jsonwebtoken")
module.exports=async(req,res,next)=>{
    try{
        const token=req.headers["authoriation"].split(" ")[1]
       jwt.verify(token,process.env.SECRET,(err,decoded)=>{
        //console.log(token)
        if(err)
        {
            return res.status(401).send({
                message:"Auth failed",
                success:false
            })
        }
        else{
            req.userId=decoded.id;
            next();
        }
    })
    }
    catch(err)
    {
        return res.status(500).send({
            message:"Auth failed",
            success:false
        })
    }

    
}