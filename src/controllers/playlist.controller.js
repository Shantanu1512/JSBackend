import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js"
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/videos.models.js"

const createPlaylist = asyncHandler( async(req, res)=>{

    /*
        get name and description from body
        get user id who is logged in
        check if playlist name is unique for single user
        if everythings fine then create playlist
    */

    const { name, description } = req.body
    const user = req.user._id

    console.log(name.toLowerCase(), description);
    const notUniqueName = await Playlist.findOne({
        owner: req.user._id,
        name: name.toLowerCase()
    })

    // console.log(uniqueName);
    if(notUniqueName){
        throw new ApiError(400, "Playlist with this name is already exists")
    }

    const playlistResponse = await Playlist.create({
        name: name.toLowerCase(),
        description: description,
        owner: user._id
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlistResponse, "Playlist created successfully!!!!")
        )
})

const getUserPlaylist = asyncHandler( async(req, res) => {
    /*
        check if user has playlists
        else throw error
        if yes then display with pipeline
    */
    const { userId } = req.params

    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "User id is invalid please enter a valid one")
    }

    const playlistPresent = await Playlist.findOne({
        owner: userId
    })

    if(!playlistPresent){
        throw new ApiError(400, "User have no playlists currently")
    }

    const playlistResponse = await Playlist.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownersDetails",
                    pipeline: [
                        {
                            $project: {
                                userName: 1
                            }
                        }
                    ]
                }
            }
        ]
    )
    console.log(playlistResponse);

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlistResponse, "Playlists fetched successfully")
        )
})

const getPlaylistById = asyncHandler( async(req, res) =>{
    /*
        check if id is valid
        check if playlist is there with id
        return pipeline data with video details as id and name
    */
    const { playlistId } = req.params

    if(!mongoose.isValidObjectId(playlistId)){
        return new ApiError(400, "Playlist id is not valid")
    }

    const playlistData = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "videoOwner",
                                foreignField: "_id",
                                as: "videoOwner",
                                pipeline: [
                                    {
                                        $project: {
                                            userName: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                title: 1,
                                duration: 1,
                                views: 1,
                                isPublished: 1,
                                videoOwner: 1
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlistData, "Playlist retrieved successfully"))
})

const addVideoToPlaylist = asyncHandler( async(req, res) =>{
    /*
        get playlist id and video id from frontend
        check if video is present with this id or throw error
        check if playlist is present with this id or throw error
        check if video is there in playlist to prevent duplication of videos
        add or insert video id into playlist id
    */
    const { playlistId, videoId } = req.params
    console.log(playlistId);
    
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id inserted please check..")
    }
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id inserted plaese check..")
    }

    const videoPresent = await Video.findById(videoId)
    if(!videoPresent){
        throw new ApiError(400, "Video with this id does not exists")
    }

    const playlistPresent = await Playlist.findById(playlistId)
    if(!playlistPresent){
        throw new ApiError(400, "Playlist with this id does not exists")
    }
    playlistPresent.videos = videoId
    console.log(playlistPresent);
    
    playlistPresent.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlistPresent, "Video successfully added to playlist")
        )
})

const removeVideoFromPlaylist = asyncHandler( async(req, res) =>{
    const { playlistId, videoId } = req.params
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id inserted please check..")
    }
    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id inserted plaese check..")
    }

    const videoPresent = await Video.findById(videoId)
    if(!videoPresent){
        throw new ApiError(400, "Video with this id does not exists")
    }

    const playlistPresent = await Playlist.findById(playlistId)
    if(!playlistPresent){
        throw new ApiError(400, "Playlist with this id does not exists")
    }

    const videoInPlaylist = await Playlist.findOne(
        {
            _id: playlistId,
            videos: videoId
        }
    )

    if(!videoInPlaylist){
        throw new ApiError(400, "Video does not exists in this playlist")
    }

    const videoRemove = await Playlist.updateOne(
        {_id: playlistId},
        {
            $pull: {
                videos: videoId
            }
        }
    )
    console.log(videoRemove);

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoRemove, "Video removed successfully..")
        )
    
})

const deletePlaylist = asyncHandler( async(req, res) =>{
    /*
        get data from FE
        check if id is valid
        check if playlist present and delete
    */
    const { playlistId } = req.params

    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Not a valid playlist id")
    }

    const playlistDelete = await Playlist.findByIdAndDelete(playlistId)

    if(!playlistDelete){
        throw new ApiError(400, "Playlist with this id does not exists or failed to delete")
    }
    console.log(playlistDelete);
    
        return res
            .status(200)
            .json(
                new ApiResponse(200, playlistDelete, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler( async(req, res) => {
    /*
        get data from FE
        check if id is valid
        check id playlist exists or throw error
        if everything fine then save data
    */
    const { playlistId } = req.params
    const { name, description } = req.body

    if(!mongoose.isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id entered")
    }

    const playlist = await Playlist.findById(playlistId)

    playlist.name = name
    playlist.description = description

    playlist.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Updated playlist")
        )
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