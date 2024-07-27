import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler( async(req, res)=>{
    const { name, description } = req.body
})

const getUserPlaylist = asyncHandler( async(req, res) => {
    const { userId } = req.params
})

const getPlaylistById = asyncHandler( async(req, res) =>{
    const { playListId } = req.params
})

const addVideoToPlaylist = asyncHandler( async(req, res) =>{
    const { playListId, videoId } = req.params
})

const removeVideoFromPlaylist = asyncHandler( async(req, res) =>{
    const { playListId, videoId } = req.params
})

const deletePlaylist = asyncHandler( async(req, res) =>{
    const { playListId } = req.params
})

const updatePlaylist = asyncHandler( async(req, res) => {
    const { playListId } = req.params
    const { name, description } = req.body
})

export{
    addVideoToPlaylist,
    createPlaylist,
    updatePlaylist,
    getPlaylistById,
    getUserPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist
}