const mongoose = require('mongoose')

const ratingAndReview = mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    user: {
        type:Number,
        required:true,
    },
    review: {
        type:String,
        required:true,
    },
})

module.exports = mongoose.model("RatingAndReview", ratingAndReview);