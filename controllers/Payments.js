const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const mongoose = require("mongoose");

// capture the payment
exports.capturePayment = async (req, res) => {
    // get course id and user id
    const {course_id} = req.body;
    const userId = req.user.id;

    // valid course id 
    if(!course_id){
        return res.status(400).json({
            success:false,
            message: "please provide a valid course id"
        });
    }

    // valid course detail
    let course;
    try {
        course = await Course.findById(course_id);
        if(!course){
            return res.status(400).json({
                success:false,
                message: "could not find the course"
            });
        }

        // check user already purchased the course
        // convert userid (string) -> objectId
        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentsEnrolled.includes(uid)){
            return res.status(200).json({
                success:false,
                message: "student is already enrolled"
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message: "something went wrong",
            error: error.message            
        });
    }

    // order create
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount: amount * 100,
        currency,
        reciept: Math.random(Date.now()).toString(),
        notes: {
            courseId: course_id,
            userId
        },
    };

    try {
        // initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        
        // return response
        return res.status(200).json({
            success:true,
            message: "order created successfully",
            courseName: course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.id,
            currency: paymentResponse.currency,
            amount: paymentResponse.amount
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message: "something went wrong, could not initiate order",
            error: error.message            
        });
    }
};

// verify signature of razorpay and server
exports.verifySignature = async (req, res) => {
    const webhookSecret = "12345678";

    // receive from razorpay in hashed format
    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    // matching
    if (signature === digest) {
        console.log('payment is authorized');

        // get user id and course id
        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try {
            // fulfill the action -> find the course and enroll the student in it
            const enrolledCourse = await Course.findById(
                {_id: courseId}, 
                {$push: {
                    studentsEnrolled: userId
                }},
                {new: true},
            );

            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message: "course not found",
                    error: error.message            
                });
            }

            console.log(enrolledCourse);

            // find the student and add course to their list of enrolled courses
            const enrolledStudent = await User.findById(
                {_id: userId}, 
                {$push: {
                    courses: courseId
                }},
                {new: true},
            );

            if(!enrolledStudent){
                return res.status(500).json({
                    success:false,
                    message: "user not found",
                    error: error.message            
                });
            }

            console.log(enrolledStudent);

            // send congrats mail for course to student
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulations from studyNotion",
                "Congratulations, you are onboarded into new studyNotion course",
            );

            console.log(emailResponse);

            // return response
            return res.status(200).json({
                success:true,
                message: "signature verified and successfully enrolled in course",
                data: emailResponse         
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success:false,
                message: "something went wrong, could not verify signature",
                error: error.message            
            });
        }
    }
    else{
        return res.status(400).json({
            success:false,
            message: "invalid request"
        });
    }
};