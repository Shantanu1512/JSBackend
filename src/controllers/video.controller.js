import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.service.js";
import { Video } from "../models/videos.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { extractPublicId } from 'cloudinary-build-url'


const getAllVideo = asyncHandler( async(req, res) =>{
    /**
     * get fields from FE
     * verify if valid ID's
     * find all videos and sort by asc or desc
     */
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //This controller will get all videos based on query sort and pagination 

    let pipeline = []

    if(query){
        pipeline.push(
            { 
                $search: {
                    "text": {
                        "query": query,
                        "path": "title"
                    }
                    }
            }
        )
    }

    console.log(userId);
    
    if(userId){
        pipeline.push({
            $match: {
                videoOwner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    if(sortBy && sortType){
        console.log(sortBy);
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ?1:-1
            }
        })
    }
    
    pipeline.push({
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
    })
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        
    };
    // let pipeline = [
    //     {
    //         $search: {
    //             "text": {
    //               "query": query,
    //               "path": "title"
    //             }
    //           }
    //     }
    // ]
    // console.log(options);
    console.log(pipeline);
    
    const aggregateResult = Video.aggregate(pipeline
        // [{
        //     $search:{
        //         title: {
        //             $regex: query
        //         }
        //     }
        // },]
        
    )
    // console.log("AGGREGATE RESULT ======",aggregateResult);
    console.log("BEFORE AGGPAGE======================================",options);

    const resss = await Video
  .aggregatePaginate(aggregateResult, options)
//   .then(function (results) {
//     console.log(results);
//   })
//   .catch(function (err) {
//     console.log(err);
//   });
    console.log(resss);
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, resss ,"All videos fetched")
        )
})


// get all videos based on query, sort, pagination
// const getAllVideo = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//     const pipeline = [];

//     if (query) {
//         pipeline.push({
//             $search: {
//                 text: {
//                     "query": query,
//                     "path": "title" // search only on title, description
//                 }
//             }
//         });
//     }


//     // Fetch videos only that are set as isPublished
//     pipeline.push({ $match: { isPublished: true } });

//     // Sort by the specified field and order
//     if (sortBy && sortType) {
//         pipeline.push({
//             $sort: {
//                 [sortBy]: sortType === "asc" ? 1 : -1
//             }
//         });
//     } else {
//         pipeline.push({ $sort: { createdAt: -1 } });
//     }

//     // Execute the search pipeline to get video IDs
//     const searchResults = await Video.aggregate(pipeline).exec();
//     const videoIds = searchResults.map(result => result._id);

//     // Create a new pipeline for pagination using the video IDs
//     const paginationPipeline = [
//         {
//             $match: { _id: { $in: videoIds } }
//         },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "ownerDetails",
//                 pipeline: [
//                     {
//                         $project: {
//                             username: 1,
//                             "avatar.url": 1
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $unwind: "$ownerDetails"
//         }
//     ];

//     const videoAggregate = Video.aggregate(paginationPipeline);

//     const options = {
//         page: parseInt(page, 10),
//         limit: parseInt(limit, 10)
//     };

//     const video = await Video.aggregatePaginate(videoAggregate, options);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, video, "Videos fetched successfully"));
// });


const publishVideo = asyncHandler( async(req, res) =>{
    const { title, description } = req.body
    //This controller will publish new video

    /*
        get title and description if missing throw error
        check for video and get lenght from it
        get thumbnail and if not then throw error
        if all present upload
        save to db
    */

        if(!title || !description){
            throw new ApiError(400,"Title or description is missing..")
        }
        const videoLocalPath = req.files?.videoFile[0]?.path
        if(!videoLocalPath){
            throw new ApiError(400, "Video file is missing here.")
        }
        console.log("VIDEO PATH ====",videoLocalPath)
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path

        console.log("THUMBAIL PATH =====",thumbnailLocalPath);
        
        if(!thumbnailLocalPath){
            throw new ApiError(400, "Thumbnail file is missing here.")
        }

        const video = await uploadOnCloudinary(videoLocalPath);
        // console.log("AFTER VIDEO UPLOADED====",video);
        
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        console.log("VIDEO DETAILS ::::", video)
        console.log("THUMBNAIL DETAILS ::::", thumbnail)


        if(!video){
            throw new ApiError(400, "Video file upload failed")
        }

        if(!thumbnail){
            throw new ApiError(400, "Thumbnail upload failed")
        }

        const user = await User.findById(req.user?._id)
        console.log("USER DETAILS ::::", user)

        const videoResponse = await Video.create({
            videoFile: video.url,
            thumbnail: thumbnail.url, 
            title,
            description,
            duration: video.duration,
            views:0,
            videoOwner: user._id
        })

        return res
            .status(200)
            .json(
                new ApiResponse(200, videoResponse ,"Video created successfully")
            )

})

const getVideoById = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
    //This controller is to get video by videoId
    /*
        find video by videoId
        if not throw error
        or return video
    */

    const video = await Video.findById(videoId)
    console.log("VIDEO DETAILS==========================",video);
    
    if(!video){
        throw new ApiError(400, "Unable to find video..")
    }


    const videoPipeline = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
              from: "users",
              localField: "videoOwner",
              foreignField: "_id",
              as: "ownerOfVideo",
              pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                userName: 1,
                            }
                        },
                       
                ]
            }
          }
    ])

    await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                views: video.views + 1
            }
        }, {new: true}
    )

    // console.log(videoPipeline[0]);
    // console.log(videoPipeline);
    return res
        .status(200)
        .json(
            new ApiResponse(200, videoPipeline,"Video by id retrieved succesfully")
        )
})

const updateVideo = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
    //This controller is to update video details like thumbnail, title, description

    /*
        find video if exists if not throw error
        save and update variable which is entered
        update db
        return status
    */

    const { title, description } = req.body
    const thumbnail = req.file?.path
    console.log(thumbnail)
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video does not exists with this id..")
    }
    const oldThumbnailURL = video.thumbnail
    const thumbnailPublicId = await extractPublicId(oldThumbnailURL)
    if(title){
        video.title = title
    }

    if(description){
        video.description = description
    }
    // console.log(video)

    let thumbnailData
    if(thumbnail){
        thumbnailData = await uploadOnCloudinary(thumbnail)
    }

    if(thumbnailData){
        video.thumbnail = thumbnailData.url
    }else{
        throw new ApiError(500, "Error while uploading thumbnail")
    }

    // const videoResponse = await video.save({validateBeforeSave:false})
    await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title: title,
                description: description,
                thumbnail: thumbnailData.url,
            }
        }
    )
    await deleteFromCloudinary(thumbnailPublicId, "image")
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Updated successfully")
        )
})

const deleteVideo = asyncHandler( async(req, res) =>{
    const { videoId } = req.params
    //This video is to delete video by videoId

    /*
        check if video exists
        if not throw error
        delete from db if exists
    */
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is not a valid")
    }
    
    const video = await Video.findByIdAndDelete(videoId)
    const videourl = video.videoFile
    const thumbnailurl = video.thumbnail
    
    const videopublicId = await extractPublicId(videourl)
    const thumbnailpublicId = await extractPublicId(thumbnailurl)
    
    
    if(!video){
        throw new ApiError(400, "Video not found")
    }else{
        deleteFromCloudinary(videopublicId, "video")
        deleteFromCloudinary(thumbnailpublicId, "image")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video deleted successfully")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    /*
        check if video exists
        if not throw error
        if present check status and alter
    */

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Unable to find video")
    }

    if(video.isPublished === true){
        video.isPublished = false
    }else{
        video.isPublished = true
    }

    const videoResponse = await video.save({validateBeforeSave:true})

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoResponse, "Status is toggled")
        )
})

export {
    getAllVideo,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}