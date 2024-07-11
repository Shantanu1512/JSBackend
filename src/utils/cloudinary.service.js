import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (filePath) =>{
    try {
        if(!filePath){
            return null
        }

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })

        //successfully uploaded file on cloudinary
        console.log("File uploaded successfully !!", response.url);
        fs.unlinkSync(filePath)
        return response
    } catch (error) {
        //This will remove file from local serer as upload is failed
        fs.unlinkSync(filePath)
        return null
    }
}

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export {uploadOnCloudinary}