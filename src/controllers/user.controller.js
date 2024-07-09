import { asyncHandler } from "../utils/asyncHandler.js"

const registerUser = asyncHandler( async (req, res) => {
    console.log("inside method")
    res.status(200).json({
        message: "Ok"
    })
})

export { registerUser }