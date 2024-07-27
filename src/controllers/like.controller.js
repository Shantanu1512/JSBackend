import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
})

const toggleCommentLike = asyncHandler( async(req, res) =>{
    const { commentId } = req.params
})

const toggleTweetLike = asyncHandler( async(req, res) =>{
    const { tweetId } = req.params
})

const getLikedVideos = asyncHandler( async(req, res) =>{

})

export{
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}