import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

const getAllVideo = asyncHandler( async(req, res) =>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //This controller will get all videos based on query sort and pagination 
})

const publishVideo = asyncHandler( async(req, res) =>{
    const { title, description } = req.body
    //This controller will publish new video
})

const getVideoById = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
    //This controller is to get video by videoId
})

const updateVideo = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
    //This controller is to update video details like thumbnail, title, description
})

const deleteVideo = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
    //This video is to delete video by videoId
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideo,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}