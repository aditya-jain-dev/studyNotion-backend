const Profile = require("../models/Profile");
const User = require("../models/User");

exports.updateProfile = async (req, res) => {
    try {
        // get data
        const {dateOfBirth = "", about = "", contactNumber, gender} = req.body;

        // get user id
        const id = req.user.id;

        // validate data
        if(!contactNumber || !gender){
            return res.status(400).json({
                success: false,
                message: 'All field are required',
            })
        };

        // Find the profile by id
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        // update profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;

        // save the updated profile
        await profileDetails.save();

        // return response
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: profileDetails
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'something went while updating profile details',
            error: error.message
        });
    }
};

// delete account -> how can we schedule this delete
exports.deleteAccount = async (req,res) => {
    try {
        // get id
        const id = req.user.id;

        // validation
        const userDetails = await User.findById({ _id: id });
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: 'user not found',
            });
        }

        // Delete Assosiated Profile with the User
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});

        // TODO: unenroll user from all enrolled courses 

        // delete user
        await User.findByIdAndDelete({_id:id});

        // return response
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while deleting the user',
        });
    }
}

explore.getAllUserDetails = async (req, res) => {
    try {
        // get id
        const id = req.user.id;

        // get user details and validation
        const userDetails = await User.findById(id).populate('additionalDetails').exec();

        console.log(userDetails);
        
        // return response
        return res.status(200).json({
            success: true,
            message: 'User data fetched successfully',
            data: userDetails
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong while fetching all user details',
            error: error.message
        });
    }
};