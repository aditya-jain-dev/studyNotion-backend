const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
    try {
        // data fetch
        const {sectionName, courseId} = req.body;

        // data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: 'Missing required Properties',
            });
        }

        // Create a new section with the given name
        const newSection = await Section.create({sectionName});

        // Add the new section to the course's content array
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent: newSection._id,
                }
            },
            {new:true},
            // populate to replace section/ sub-sections both in the updatedCourseDetails
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();

        // return response
        return res.status(200).json({
            success: true,
            message: 'Section created successfully',
            data: updatedCourseDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while creating the section',
            error: error.message,
        });
    }
}

exports.updateSection = async (req, res) => {
    try {
        // data fetch
        const {sectionName, sectionId} = req.body;

        // data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success: false,
                message: 'Missing Properties',
            });
        }

        // update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true});

        // return response
        return res.status(200).json({
            success: true,
            message: 'Section updated successfully',
            data: section
        });
    } catch (error) {
        console.error("Error updating section:", error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while updating the section',
            error: error.message,
        });
    }
}

exports.deleteSection = async (req, res) => {
    try {
        // data id -> assuming that we are sending id in params
        const {sectionId} = req.params;

        // data validation
        if(!sectionId){
            return res.status(400).json({
                success: false,
                message: 'Missing Properties',
            });
        }

        // update data
        await Section.findByIdAndDelete(sectionId);

        // TODO[testing]: do we need to delete the entry from the course schema?

        // return response
        return res.status(200).json({
            success: true,
            message: 'Section deleted successfully',
        });
    } catch (error) {
        console.error("Error deleting section:", error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while deleting the section',
            error: error.message,
        });
    }
}