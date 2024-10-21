import User from "../models/userModel.js";
import bcrypt from 'bcrypt';
import { generateTokenAndSetCookie } from "../webtoken/generateToken.js";

export const createUser = async(req,res) =>{
    try {
        const {username,email,password} = req.body;

        if(!username || !email || !password){
            return res.status(401).json({message:"Not all fields are filled"});
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email already taken" });
        }




        const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
    
        const newUser = new User({
			username,
			email,
			password: hashedPassword,
		});

        await newUser.save();

        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({ message: "User created successfully", newUser});
    
    } catch (error) {
		console.log("Error in signup controller", error.message);
        return res.status(401).json({message:"Error in creating new user"})
    }
}