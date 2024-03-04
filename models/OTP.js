const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const otpSchema = new mongoose.Schema({
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
        default:Date.now,
        expires:5*60, // The document will be automatically deleted after 5 minutes of its creation time
    },
})

// function -> to send email
async function sendVerificationEmail(email, otp) {
    const title = 'Verification Email from StudyNotion';
    try {
        const mailResponse = await mailSender(email, title, emailTemplate(otp)); 
        console.log('Email sent successfully: ', mailResponse.response);
    } catch (error) {
        console.log('Error occured while sending otp mail: ', error);
        throw error;
    }
}

// Define a post-save hook to send email after the document has been saved
otpSchema.pre("save", async function(next){
    console.log("New document saved to database");

    // Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    
    next();
})

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;