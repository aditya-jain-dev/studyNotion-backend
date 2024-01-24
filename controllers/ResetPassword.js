const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require('bcrypt');
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
        message: "Your email is not registered with us",
      });
    }

    // generate token
    const token = crypto.randomUUID();

    // update user by adding token and expiration time
    const updatedDetails = User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true } // updated res or details return to us
    );

    // create url
    const url = `http://localhost:3000/update-password/${token}`;

    // send mail containing the url
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link: ${url}`
    );

    // return response
    return res.status(200).json({
      success: true,
      message:
        "Email sent successfully, please check email and change password",
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
                message:'Password not matching'
            })
        }

        // get user details from db using token
        const userDetails = await User.findOne({token: token});

        // if no entry - invalid token
        if(!userDetails){
            return res.status(401).json({
                success:false,
                message:'Token not found'
            })
        }

        // token time check
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.status(401).json({
                success:false,
                message:'Reset password link expires, please regenerate your link again'
            })
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS);

        // password update
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
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
            message:'Something went wrong while reset password'
        })
    }
}