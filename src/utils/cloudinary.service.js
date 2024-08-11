import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (filePath) =>{
    try {

        console.log("FILE PATH ON CLOUDINARY", filePath);
        
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

const deleteFromCloudinary = async(public_id, resource_type) =>{
try {
    console.log(public_id);
    if(!public_id){
        return null
    }
    
    const response = await cloudinary.uploader.destroy(public_id, {resource_type: `${resource_type}`})

    console.log("File deleted successfully !!", response );
        
        return response
} catch (error) {
    console.log(error);
    return null
}
}

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export {uploadOnCloudinary, deleteFromCloudinary}