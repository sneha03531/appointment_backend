const express=require("express");
require('dotenv').config()
const app=express();
const cors=require("cors");
const dbConfig=require("./config/dbConfig");
app.use(express.json());

const userRoutes=require("./routes/userRoute");
const doctorRoutes=require("./routes/doctorRoute");
const adminRoutes=require("./routes/adminRoutes")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/user",userRoutes);
app.use("/api/user",doctorRoutes);
app.use("/api/admin",adminRoutes);


const port=process.env.PORT || 5000;



app.listen(port,()=>console.log(`server runs at ${port}`));