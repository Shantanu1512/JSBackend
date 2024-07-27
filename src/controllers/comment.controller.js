import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComment = asyncHandler( async(req, res) =>{
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
})

const addComment = asyncHandler( async(req, res) =>{
    
})

const updateComment = asyncHandler( async(req, res) =>{

})

const deleteComment = asyncHandler( async(req, res) =>{

})

export{
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}