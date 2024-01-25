const course = require('../models/Course');
const Tag = require('../models/Tag');
const User = require('../models/User');
const {uploadImageToCloudinary} = require('../utils/imageUploader');

exports.createCourse = async (req, res) => {
    try {
        // fetch data
        const {courseName, courseDescription, whatWillYouLearn, price, tag} = req.body;
        
        // fetch file
        const thumbnail = req.files.thumbnailImage;

        // validation
        if(!courseName, !courseDescription, !whatWillYouLearn, !price, !tag){
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            })
        }

        // instructor validation
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log('Instructor Details:', instructorDetails);

        // TODO: verify that userId and instructorDetails._id are same or different ?

        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: 'Instructor details not found',
            })
        }

        // valid tag
        const tagDetails = await Tag.findById(tag);
        console.log('Tag Details:', tagDetails);

        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: 'Tag details not found',
            })
        }

        // upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // create course entry in db
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatWillYouLearn,
            price,
            tag: tagDetails._id,
            thumbnail: thumbnailImage.secure_url
        })

        // add course entry in user schema
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    course: newCourse._id,
                }
            },
            {new: true}
        );

        // add course entry in tag -> galat bhi ho skta hai
        await Tag.findByIdAndUpdate(
            {_id: tagDetails._id},
            {
                $push: {
                    course: newCourse._id,
                }
            },
            {new: true}
        );

        // return response
        return res.status(200).json({
            success: true,
            message: 'Successfully created course',
            data: newCourse,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to create a course',
        })
    }
}

exports.showAllCourses = async (req, res) => {
    try {
        // const allCourses = await Course.find({},{courseName: true,
        //                                         price: true,
        //                                         thumbnail: true,
        //                                         instructor: true,
        //                                         ratingAndReviews: true,
        //                                         studentsEnrolled: true
        //                                         })
        //                                         .populate("instructor")
        //                                         .exec()

        const allCourses = await Course.find({});
        
        return res.status(200).json({
            success: true,
            message: 'Successfully fetched data',
            data: allCourses
        })
            
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Cannot fetch course data',
        })
    }
};