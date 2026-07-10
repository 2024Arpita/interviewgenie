const express=require("express")
const {protect}=require("../middlewares/authMiddleware")
const {loginUser,registerUser,getUserProfile}=require("../controllers/authController")
const router=express.Router();

//auht routes
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/profile",protect,getUserProfile);

module.exports=router;