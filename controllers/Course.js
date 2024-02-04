const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');
const {uploadImageToCloudinary} = require('../utils/imageUploader');

exports.createCourse = async (req, res) => {
    try {
        // fetch data
        let {courseName, courseDescription, whatYouWillLearn, price, tag, category, status, instructions} = req.body;
        
        // fetch file
        const thumbnail = req.files.thumbnailImage;

        // validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !category || !instructions || !thumbnail){
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            })
        }

        if (!status || status === undefined) {
			status = "Draft";
		}

        // instructor validation
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, {accountType: "Instructor"});

        // TODO: verify that userId and instructorDetails._id are same or different ?

        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: 'Instructor details not found',
            })
        }

        console.log('Instructor Details:', instructorDetails);

        // valid category
        const categoryDetails = await Category.findById(category);

        if(!categoryDetails){
            return res.status(404).json({
                success: false,
                message: 'Category details not found',
            })
        }

        console.log('Category Details:', categoryDetails);

        // Upload the Thumbnail to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // create course entry in db
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status,
            instructions
        })

        // Add the new course to the User Schema of the Instructor
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    course: newCourse._id,
                }
            },
            {new: true}
        );

        // add course entry in category -> galat bhi ho skta hai
        await Category.findByIdAndUpdate(
            {_id: categoryDetails._id},
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
        console.error(error);
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

        const allCourses = await Course.find({}).populate("instructor").exec();
        
        return res.status(200).json({
            success: true,
            message: 'Successfully fetched data',
            data: allCourses
        })
            
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Cannot fetch course data',
        })
    }
};