const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const otpSchema = mongoose.Schema({
    email: {
        type:String,
        required:true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires:5*60,
    },
})

// function -> to send email
async function sendVerificationEmail(email, otp) {
    const title = 'Verification Email from StudyNotion';
    try {
        const mailResponse = await mailSender(email, title, otp);
        console.log('Email sent successfully: ', mailResponse);
    } catch (error) {
        console.log('error occured while sending otp mails: ', error);
        throw error;
    }
}

otpSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email, this.otp);
    next();
})

module.exports = mongoose.model("OTP", otpSchema);