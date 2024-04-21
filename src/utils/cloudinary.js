import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: 'djxigze5l', 
    api_key: '287459617835886', 
    api_secret: 'JyGYgz_3mSrbr4p__1cfXPgXZII'
})

const uploadOnCloudinary =async (localFilePath)=>{
     console.log(localFilePath)
    try{
        if(!localFilePath) return null;
        const response =await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
        console.log(response)
        // fs.unlinkSync(localFilePath)
        return response
    }
    catch(err){
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null

    }
}


export {uploadOnCloudinary}