require("dotenv").config(); //loads env variables from .env file
const express=require("express"); //loads express to build srestapi
const cors=require("cors"); //allow requsts from other origin connect frontend to backend
const path=require("path");  //handling file path

const app=express(); //express appp created

//middleware to handle cors
app.use(
    cors({
        origin:"*",
        methods:["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type","Authorization"],
    })
);

//middleware
app.use(express.json());  //json to java script object

//routes

///serve uploads folder
app.use("/uploads",express.static(path.join(__dirname,"uploads"),{}));

//start server
const PORT=process.env.PORT ||5000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`)); //start server