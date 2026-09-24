const express=require('express')
const {createSession,getSessionById,getMySessions,deleteSession,completeSession}=require('../controllers/sessionController');
const {protect}=require("../middlewares/authMiddleware");

const router=express.Router();

router.post('/create',protect,createSession);
router.get('/my-sessions',protect,getMySessions);
router.get('/:id',protect,getSessionById);
router.patch('/:id/complete',protect,completeSession);
router.delete('/:id',protect,deleteSession);

module.exports=router;