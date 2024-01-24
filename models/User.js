const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    firstName: {
        type:String,
        required:true,
        trim:true,
    },
    lastName: {
        type:String,
        required:true,
        trim:true,
    },
    email: {
        type:String,
        required:true,
        trim:true,
    },
    password: {
        type:String,
        required:true,
        trim:true,
    },
    accountType: {
        type:String,
        enum:["Admin", "Student", "Instrutor"],
        required:true,
    },
    additionalDetails: {
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"Profile",
    },
    courses: [
        {
            type:mongoose.Types.ObjectId,
            required:true,
        }
    ],
    image:{
        type:String,
        required:true,
    },
    courseProgress: [
        {
            type:mongoose.Types.ObjectId,
            ref:"CourseProgress",
        }
    ],
    // add token and expiry for reset the password
    token: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    }
})

module.exports = mongoose.model("User", userSchema);