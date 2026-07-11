const express=require("express")
const {protect}=require("../middlewares/authMiddleware")
const {loginUser,registerUser,getUserProfile}=require("../controllers/authController")
const upload=require("../middlewares/uploadMiddleware")
const router=express.Router();

//auht routes
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/profile",protect,getUserProfile);

router.post("/upload-image",upload.single("image"),(req,res)=>{
    if(!req.file){
        return res.status(400).json({message:"No file upload"});
    }
    const imageUrl=`${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
    }`;
    res.status(200).json({imageUrl});
});

module.exports=router;