import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    console.log("Request Cookies: ", req.cookies);
    const token = req.cookies.jwt; // Check if this is correctly set

    console.log("Token from cookies:", token); // Debug log

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.log("JWT Error:", error); // Log the error for debugging
        return res.status(401).json({ message: "Invalid token" });
    }
};