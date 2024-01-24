const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
        message: "User already registered",
      });
    }

    // generate OTP
    var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    })
    console.log('OTP generated: ', otp);

    // check unique otp or not
    const result = await OTP.findOne({otp: otp});

    // brute-force -> har baar db me check krna padh rha hai already koi otp hai ya ni
    // we use library for unique case
    while (result) {
        otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        result = await OTP.findOne({otp: otp});
    }

    // create an entry in db for otp
    const otpPayload = {email, otp};

    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    // return response successfull
    return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
    });

  } catch (error) {
    console.log(error);
    return res.status(200).json({
        success: false,
        message: error.message,
    });
  }
};

// signup
exports.signUp = async (req, res) => {
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
                message:'User is already registered'
            })
        }

        // find most recent otp stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log('recentOTP: ', recentOtp);

        // validate otp
        if(recentOtp.length == 0){
            // otp not found
            return res.status(400).json({
                success:false,
                message:'OTP not found in DB'
            })
        }else if(otp !== recentOtp.otp){
            // invalid otp
            return res.status(400).json({
                success:false,
                message:'Invalid OTP'
            })
        }
 
        // hash password
        const hashedPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS)

        // entry created in DB
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })

        const user = User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        // return res
        return res.status(200).json({
            success:true,
            message:'User is registered successfully',
            user,
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
            return res.status(403).json({
                success:false,
                message:'All fields are required, please try again',
            })
        }

        // check user exist or not
        const user = User.findOne({email}).populate("additonalDetails");

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

        // match old password


        // match password and confirm passsword
        if(newPassword !== confirmNewPassword){
            return res.status(400).json({
                success:false,
                message:'Password and Confirm Password value does not match, please try again'
            })
        }

        // create hash
        const hashedPassword = bcrypt.hash(newPassword, process.env.SALT_ROUNDS);

        // update password in db
        // const user = await User. 


        // send mail -- password updated

        // return response
    } catch (error) {
        
    }
}
