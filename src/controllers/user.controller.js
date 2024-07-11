import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.service.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
export { 
            registerUser,
            loginUser,
            logoutUser
        }