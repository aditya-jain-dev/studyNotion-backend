const mongoose = require('mongoose')

const courseProgress = mongoose.Schema({
    courseID: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
    },
    completedVideos: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"subSection",
    },
})

module.exports = mongoose.model("courseProgress", courseProgress);