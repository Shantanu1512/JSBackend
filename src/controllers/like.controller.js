import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/videos.models.js"
import { Likes } from "../models/likes.models.js"
import { Comments } from "../models/comment.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const toggleVideoLike = asyncHandler( async(req, res) =>{
    /**
     * get videoid from FE and user id
     * check if id is valid
     * check if video exists
     * check if video is already liked
     * find video by id and update likedBy field 
     */

    const { videoId } = req.params
    const user = req.user._id

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is invalid")
    }
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video does not exists")
    }

    const isVideoLiked = await Likes.findOne({
        video: videoId,
        likedBy: user._id
    })
    console.log("IS VIDEO LIKED BY USER",isVideoLiked);

    let response
    if(!isVideoLiked){
        await Likes.create(
            {
                video: videoId,
                likedBy: user._id
            }
        )

        response = "Video is liked"
    }
    else{
        response = await Likes.findByIdAndDelete(
            isVideoLiked._id
        )

        response = "Video is dis-liked"
    }
    console.log(response);
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Video status toggled")
        )

})

const toggleCommentLike = asyncHandler( async(req, res) =>{
    const { commentId } = req.params
    const user = req.user._id

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Comment id ks invalid")
    }

    const comment = await Comments.findById(commentId)
    if(!comment){
        throw new ApiError(400, "No comment is there")
    }

    const commentLike = await Likes.findOne({
        likedBy: user._id,

        comment: commentId,
    })
    console.log(commentLike);
    
    let response
    if(commentLike?.likedBy.equals(user._id)){
        await Likes.findByIdAndDelete(comment._id)
        response = "Comment is-liked"
    }else{
        await Likes.create({comment: commentId, likedBy: user._id})
        response = "Comment is liked"
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Comment toggle")
        )
})

const toggleTweetLike = asyncHandler( async(req, res) =>{
    const { tweetId } = req.params
})

const getLikedVideos = asyncHandler( async(req, res) =>{
    const user = req.user

    const videos = await Likes.aggregate(
        [
            {
                $match: {
                    likedBy: user._id,
                    video: {$exists: true}
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video",
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                duration: 1,
                                views: 1
                            }
                        }
                    ]
                }
            }
        ]
    )

    console.log(videos);
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Fetched videos")
        )
})

export{
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}