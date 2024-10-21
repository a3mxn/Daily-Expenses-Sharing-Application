import User from "../models/userModel.js";
import bcrypt from 'bcrypt';
import { generateTokenAndSetCookie } from "../webtoken/generateToken.js";

export const createUser = async(req,res) =>{
    try {
        const {username,email,password,mobile} = req.body;

        if(!username || !email || !password || !mobile){
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

        const existingUserByMobile = await User.findOne({ mobile });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Mobile already taken" });
        }

        const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
    
        const newUser = new User({
			username,
			email,
			password: hashedPassword,
            mobile,
		});

        await newUser.save();

        generateTokenAndSetCookie(newUser._id, res);
        console.log(`User created successfully. username = ${newUser.username}`);
        res.status(201).json({ message: "User created successfully", newUser});
    
    } catch (error) {
		console.log("Error in signup controller", error.message);
        return res.status(401).json({message:"Error in creating new user"})
    }
}
export const loginUser = async (req, res) => {
    try {
        const { loginIdentifier, password } = req.body; // Renamed for clarity

        if (!loginIdentifier || !password) {
            return res.status(401).json({ message: "Not all fields are filled" });
        }

        // Check if the user exists using username, email, or mobile
        const existingUser = await User.findOne({
            $or: [
                { username: loginIdentifier },
                { email: loginIdentifier },
                { mobile: loginIdentifier }
            ]
        });

        if (!existingUser) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate token and set it in a cookie
        generateTokenAndSetCookie(existingUser._id, res);

        // Respond with success message and user data (optional)
        console.log(`User logged in successfully. username = ${existingUser.username}`);
        res.status(200).json({ message: "Login successful", user: { username: existingUser.username, email: existingUser.email } });

    } catch (error) {
        console.log("Error in login controller", error.message);
        return res.status(500).json({ message: "Error in logging in" });
    }
}

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.userId; // This comes from the auth middleware

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log(`got current user username = ${user.username}`);
        res.status(200).json({ user });
    } catch (error) {
        console.log("Error fetching user profile", error.message);
        return res.status(500).json({ message: "Error fetching user profile" });
    }
};

export const fetchFriends = async (req, res) => {
    try {
        const users = await User.find({}, { _id: 1, username: 1, email: 1 });
        return res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Error fetching users" });
    }
};
