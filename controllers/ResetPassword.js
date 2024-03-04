const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require('bcrypt');
const crypto = require("crypto");
require('dotenv').config();

// resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    // get email from req body
    const email = req.body.email;

    // check user for this email, email validation
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        // update status code correctly
        success: false,
        message: `This Email: ${email} is not Registered With Us. Enter a Valid Email `,
      });
    }

    // generate token
    const token = crypto.randomBytes(20).toString("hex");

    // update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + (1 * 60 * 60 * 1000),
      },
      { new: true } // updated res or details return to us
    );
    console.log("DETAILS", updatedDetails);

    // create url
    const url = `http://${process.env.API_URL}${process.env.PORT}/update-password/${token}`;

    // console.log(url);

    // send mail containing the url
    await mailSender(
      email,
      "Password Reset",
      `Your Link for email verification is ${url}. Please click this url to reset your password.`
    );

    // return response
    return res.status(200).json({
      success: true,
      message:"Email Sent Successfully, Please Check Your Email to Continue Further",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset password link",
    });
  }
};
 
// resetPassword
exports.resetPassword = async (req, res) => {
    try {
        // data fetch
        const {password, confirmPassword, token} = req.body;

        // validation
        if(password !== confirmPassword){
            return res.status(401).json({
                success:false,
                message:'Password and Confirm Password Does not Match'
            })
        }

        // get user details from db using token
        const userDetails = await User.findOne({token: token});

        // if no entry - invalid token
        if(!userDetails){
            return res.status(401).json({
                success:false,
                message:'Token is invalid'
            })
        }

        // token time check
        if(!(userDetails.resetPasswordExpires > Date.now())){
            return res.status(403).json({
                success:false,
                message:'Reset password link expires, please regenerate your reset link again'
                // message: `Token is Expired, Please Regenerate Your Token`,
            })
        }

        // hash password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // password update
        await User.findOneAndUpdate(
            {token: token},
            {password: encryptedPassword},
            {new: true},
        );

        // return response
        return res.status(200).json({
            success:true,
            message:'successfully reset password'
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Something went wrong while reset password',
            error: error.message,
        });
    }
};