import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Photo} from "../models/photo.model.js"
import {User} from "../models/user.model.js"
import mongoose from "mongoose"

import {ApiResponse} from "../utils/ApiResponse.js"

const uploadPhoto=asyncHandler(async(req,res)=>{
    
    const photoLocalPath =req.file?.path;
    console.log("user  in upload",req.user)

    console.log("user ki id in upload",req.user._conditions._id)
    if(!photoLocalPath){
        throw new ApiError(404,"photo file is missing");
    }

    const photo = await uploadOnCloudinary(photoLocalPath);

    if(!photo){
        throw new ApiError(500,"something went wrong while uploading photo");
    }

    const myPhoto = await Photo.create({
        photoFile:photo.url,
        owner:req.user._conditions._id
    })

    return res.status(200, myPhoto,"photo uploaded successfully")

})

const receivePhoto= asyncHandler(async(req,res)=>{
  const photo= await Photo.aggregate([
    {
        $sort: {
          createdAt: -1 // Sort in descending order based on the createdAt field
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner_details"
        }
    },
    {
        $unwind: "$owner_details" // Deconstructs ownerDetails array into separate documents
    },
    {
        $project:{
           
            photoFile:1,
            owner_details:{
                _id:1,
                username:1,
                avatar:1
            }
        }
    }
    
   ])


//   console.log(photo)
//   console.log(photo[0])

   if(!photo?.length){
    throw new ApiError(404,"photo does not exist")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,photo,"photo fetched successfully")
   )
})

export {uploadPhoto,receivePhoto}