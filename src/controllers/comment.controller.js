import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/videos.models.js"
import { Comments } from "../models/comment.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const getVideoComment = asyncHandler( async(req, res) =>{
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
})

const addComment = asyncHandler( async(req, res) =>{
    /*
        get video id from FE
        check if id provided is correct
        check if video exists 
        create one comment document 
    */

    const { videoId } = req.params
    const user = req.user._id
    const { content } = req.body
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is invalid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video with this id does not exists")
    }

    const comment = await Comments.create(
        {
            content: content,
            video: video._id,
            owner: user._id
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment added to video successfully")
        )
})

const updateComment = asyncHandler( async(req, res) =>{
    /**
     * get video id and content from FE
     * check if id is valid
     * check if comment id is valid 
     * if logged in user and db user not same then don't allow to update comment
     * update comment content
     */

    const {commentId} = req.params
    const user = req.user._id
    const { content } = req.body

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Not a valid comment id")
    }

    const commentDetails = await Comments.findById(commentId)

    if(!commentDetails){
        throw new ApiError(400, "Unable to find comment")
    }

    const dbUser = commentDetails.owner.toString()
    const currentUser = user._id.toString()
    console.log(dbUser);
    console.log(currentUser);
    
    if(dbUser != currentUser){
        throw new ApiError(400, "You cannot update others comments")
    }

    commentDetails.content = content

    const response = await commentDetails.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Comment updated successfully")
        )
})

const deleteComment = asyncHandler( async(req, res) =>{
/**
 * get comment id from FE 
 * chekck if id is valid
 * check if comment exists
 * check if logged in user and db user are same
 * delete comment
 */

    const {commentId} = req.params
    const user = req.user._id

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comments.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment does not exists")
    }

    if(!comment.owner.equals(user._id)){
        throw new ApiError(400, "You cannot delete others comments")
    }

    const response = await Comments.deleteOne({
        _id: commentId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Comment delted successfully")
        )
})

export{
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}