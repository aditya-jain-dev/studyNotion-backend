const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require('dotenv').config();

// send otp
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from req body
    const { email } = req.body;

    // check if user already exist
    const checkUserPresent = await User.findOne({ email });

    // if user already exist, then return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User is Already registered",
      });
    }

    // generate OTP
    var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    })

    // check unique otp or not
    const result = await OTP.findOne({otp: otp});

    console.log("Result is Generate OTP Func");
	console.log("OTP", otp);
	console.log("Result", result);

    // brute-force -> har baar db me check krna padh rha hai already koi otp hai ya ni
    // we use library for unique case
    while (result) {
        otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
    }

    // create an entry in db for otp
    const otpPayload = {email, otp};

    const otpBody = await OTP.create(otpPayload);
    console.log("OTP Body", otpBody);

    // return response successfull
    return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        otp
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: error.message,
    });
  }
};

// signup
exports.signup = async (req, res) => {
    try {
        // fetch data from req body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType, // confirm one detail present
            contactNumber, // not compulsary
            otp
        } = req.body;

        // validate
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }

        // match password and confirm password
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:'Password and Confirm Password value does not match, please try again'
            })
        }

        // check user exist or not
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success:false,  
                message:'User already exists. Please sign in to continue.'
            })
        }

        // find most recent otp stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log('recentOTP: ', recentOtp);

        // validate otp
        if(recentOtp.length == 0){
            // OTP not found for the email
            return res.status(400).json({
                success:false,
                message:'OTP not found in DB'
            })
        }else if(otp !== recentOtp[0].otp){
            // invalid otp
            return res.status(400).json({
                success:false,
                message:'Invalid OTP'
            })
        }
 
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create the user
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        // Create the Additional Profile For User
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        // return res
        return res.status(200).json({
            success:true,
            message:'User is registered successfully',
            data: user,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'User cannot be registered. Please try again',
        })
    }
}

// login
exports.login = async (req, res) => {
    try {
        // fetch data from req body
        const {email, password} = req.body;

        // validation data
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:'Please Fill up All the Required Fields',
            })
        }

        // check user exist or not
        const user = await User.findOne({email}).populate("additionalDetails");

        if(!user){
            return res.status(401).json({
                success:false,
                message:'User is not registered, please signup first',
            })
        }

        // password match & create jwt token
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '2h',
            });

            // Save token to user document in database
            user.token = token;
            user.password = undefined;

            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }

            res.cookie('token', token, options).status(200).json({
                success:true,
                token,
                user,
                message:'Logged in sucessfully',
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login failure, please try again',
        })
    }
}

// change password
exports.changePassword = async (req, res) => {
    try {
        // fetch data from req body -> old, new, confirmNew
        const {oldPassword, newPassword, confirmNewPassword} = req.body;

        // validation
        if(!oldPassword || !newPassword || !confirmNewPassword){
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }

        // validate old password
		const userDetails = await User.findById(req.user.id);

        const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);

        // If old password does not match, return a 401 (Unauthorized) error
        if (!isPasswordMatch) {
			return res.status(401).json(
                { 
                    success: false, 
                    message: "The password is incorrect" 
                }
            );
		}

        // match password and confirm passsword
        if(newPassword !== confirmNewPassword){
            return res.status(400).json({
                success:false,
                message:'Password and Confirm Password value does not match, please try again'
            })
        }

        // create hash
        const hashedPassword = bcrypt.hash(newPassword, 10);

        // update password in db
        const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: hashedPassword },
			{ new: true }
		);

        // send mail -- password updated
        try {
            const enailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
            );
            console.log("Email sent successfully:", emailResponse.response);
        } catch (error) {
            console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
        }

        // return response
        return res.status(200).json(
            { 
                success: true, 
                message: "Password updated successfully" 
            }
        );
    } catch (error) {
        console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
    }
}
