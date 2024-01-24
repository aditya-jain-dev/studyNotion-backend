const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// next ko me route me define krta hu

// auth -> verify token
exports.auth = async (req, res) => {
    try {
        // extract token
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");

        // if token is missing
        if(!token){
            return res.status(401).json({
                success:false,
                message:'Token is missing'
            })
        }

        // verify token
        try {
            const decode = await jwt.verify(token, process.env.SECRET_KEY);
            console.log(decode);
            req.user = decode;
        } catch (error) {
            return res.status(401).json({
                success:false,
                message:'Token is invalid'
            })
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success:false,
            message:'Something went wrong while validating the token'
        })
    }
}

// isStudent
exports.isStudent = async (req, res, next) => {
    try {
        if(req.user.accountType !== 'Student'){
            return res.status(401).json({
                success:false,
                message:'This is a protected route for students only'
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified'
        })
    }
}

// isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        if(req.user.accountType !== 'Instructor'){
            return res.status(401).json({
                success:false,
                message:'This is a protected route for instructor only'
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified'
        })
    }
}

// isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        if(req.user.accountType !== 'Admin'){
            return res.status(401).json({
                success:false,
                message:'This is a protected route for admin only'
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified'
        })
    }
}