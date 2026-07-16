require("dotenv").config(); //loads env variables from .env file
// console.log("JWT_SECRET:", process.env.JWT_SECRET);
const express=require("express"); //loads express to build srestapi
const cors=require("cors"); //allow requsts from other origin connect frontend to backend
const path=require("path");  //handling file path
const connectDB = require("./config/db");
const authRoutes=require("./routes/authRoutes")
const sessionRoutes=require("./routes/sessionRoutes")
const questionRoutes=require("./routes/questionRoutes")
const {protect} = require("./middlewares/authMiddleware");
const { generateInterviewQuestions, generateConceptExplaination } = require("./controllers/aiController");
const app=express(); //express appp created

//middleware to handle cors
app.use(
    cors({
        origin:"*",
        methods:["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type","Authorization"],
    })
);

connectDB();

//middleware
app.use(express.json());  //json to java script object

//routes
app.use("/api/auth",authRoutes);
app.use("/api/sessions",sessionRoutes);
app.use("/api/questions",questionRoutes);

app.use("/api/ai/generate-questions",protect,generateInterviewQuestions);
app.use("/api/ai/generate-explaination",protect,generateConceptExplaination);

///serve uploads folder
app.use("/uploads",express.static(path.join(__dirname,"uploads"),{}));

//start server
const PORT=process.env.PORT ||5000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`)); //start server