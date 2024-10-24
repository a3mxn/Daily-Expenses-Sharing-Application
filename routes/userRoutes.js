import { createUser,loginUser,getUserProfile,fetchFriends } from '../controllers/userController.js';
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/signup", createUser);
router.post("/login",loginUser);
router.get("/getuser",authMiddleware,getUserProfile);
router.get("/",fetchFriends);


export default router;
