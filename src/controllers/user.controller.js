import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateRefreshAndAccessTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        console.log(user)
        const refreshToken = await user.genarateRefreshToken()
        const accessToken = await user.generateAccessToken()
        // console.log(refreshToken)
        // console.log(accessToken)

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        // console.log(refreshToken)
        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens!!")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { userName, fullName, email, password} = req.body
    console.log("Email", email)
    console.log("fullName", fullName)
    console.log("password", password)
    console.log("userName", userName)

    if(
        [fullName, userName, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required to enter !!!")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })    

    if(existedUser){
        throw new ApiError(409, "User with this email or username already exists !!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required here!!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar image is required to upload!!")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating new user!!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!!")
    )
})

const loginUser = asyncHandler( async( req, res) => {
    //req body -   > data
    // email or username in db
    // find the user
    // password check
    // generate access and refresh tokens
    // send cookies 

    const { userName, email, password } = req.body

    if(!(userName || email)){
        throw new ApiError(400, "Please provide username or email")
    }

    const user = await User.findOne({
        $or: [{userName},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exists!!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password entered!!")
    }

    const { refreshToken, accessToken } = await generateRefreshAndAccessTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

        // console.log(loggedInUser)

    return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully !! Welcome to application.")
            )
})

const logoutUser = asyncHandler( async(req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    console.log("UserController LogoutMethod", user)
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully, please visit again!!"))
})

const refreshAccessToken = asyncHandler( async( req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized access!!!")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token!!!")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token expired or used!!!")
        }
    
        const { accessToken, newRefreshToken } = await generateRefreshAndAccessTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    201, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async(req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect!!")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password set successful"))
})

const getCurrentUser = asyncHandler( async(req, res) =>{
    return res
        .status(200)
        .json(
            200,
            req.user,
            "Current user returned successfully!!"
        )
})

const updateUserAvatar = asyncHandler( async(req, res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file path is wrong!!")
    }

    const avatar = uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar !!")
    }
})

const updateCoverImage = asyncHandler( async(req, res) =>{
    const coverImagePath = req.file?.path

    if(coverImagePath){
        throw new ApiError(400, "Cover Image path is wrong!!")
    }

    const coverImage = uploadOnCloudinary(coverImagePath)
 
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover image !!")
    }


})

const getUserChannelProfile = asyncHandler( async(req, res) =>{

    const {userName} = req.params

    if(!userName?.trim()){
        throw new ApiError(400, "Username is missing!!")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase(),
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true, 
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName:1,
                userName:1,
                email:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])

    console.log(channel)

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists!!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0],"User channel fetched successfully!!!!")
        )
})
export { 
            registerUser,
            loginUser,
            logoutUser,
            refreshAccessToken,
            changeCurrentPassword,
            getCurrentUser,
            updateUserAvatar,
            updateCoverImage,
            getUserChannelProfile
        }