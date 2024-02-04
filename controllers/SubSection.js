const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.createSubSection = async (req, res) => {
    try {
        // Extract necessary information from the request body
        const {sectionId, title, timeDuration, description} = req.body;

        // extract file/video
        const video = req.files.videoFile;

        // data validation
        if(!sectionId || !title || !timeDuration || !description || !video){ 
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        };

        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        // Create a new sub-section with the necessary information
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        // Update the corresponding section with the newly created sub-section
        const updateSection = await Section.findByIdAndUpdate(
            {_id:sectionId}, 
            {$push: {
                subSection: SubSectionDetails._id
            }}, 
            {new:true}
        ).populate("subSection");

        // Return the updated section in the response
        return res.status(200).json({
            success: true,
            message: 'Section created successfully',
            data: updateSection
        });
    } catch (error) {
        console.error("Error creating new sub-section:", error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while creating the sub-section',
            error: error.message,
        });
    }
}

// HW: updateSubSection, deleteSubSection