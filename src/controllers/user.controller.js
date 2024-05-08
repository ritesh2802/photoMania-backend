import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User }from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})

// generate access and refresh token 
const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user =await  User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();
        user.refreshToken = refreshToken ;
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
    }
    catch(err){
        throw new ApiError(500,"something went wrong while generating token")
    }
}




// register
const registerUser = asyncHandler(async(req,res)=>{
    // take all the details from the user
    // validation => not empty
    // check if user already exists:username ,email
    // check for images , especially avatar
    // upload them to cloudinary,avatar
    //  create user obj create entry in db
    // remove pass and refresh token from res
    // check for user creation
    // return res
    
    //take details from the user
    const {email,fullName,username,password} = req.body
    console.log(email)
    console.log(password)
    // validation for empty field
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    
    ){
        throw new ApiError(404,"All fields are required")
    }

    // check if user already exists
    const existedUser= await User.findOne(
        {
            $or:[{username},{email}]
        }
    )

    if(existedUser){
        throw new ApiError(409,"user already exists")
    }
    console.log(req.files)
    // taking files(images) from the user
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    
  
    console.log("avatar local path "+ avatarLocalPath)
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log("cover local path "+ coverImageLocalPath)


    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("Avatar cloudinary",avatar)
    console.log("cover Image cloudinary",coverImage)


    if(!avatar){
        throw new ApiError(400,"avatar is required hai")
    }

    // create user obj in db
    const user =await User.create({
        email,
        password,
        fullName,
        username:username.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage?.url||""
    })

    // reove pass and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password  -refreshToken"
    )

    //check if user is created
    if(!createdUser){
        throw new ApiError(500,"error while registering the user")
    }

    // retrun res
    res.status(200).json(
        new ApiResponse(200,"user created successfully")
    )
})


//login
const loginUser = asyncHandler(async(req,res)=>{
    // take user details => email ,username ,password  
    //check if details are not empty 
    // validate password
    // genrate access token and refresh toke
    // send them through cookies
    console.log(req.body)
    const {email,username,password} =  req.body;

    console.log("email => ",email)
    if(!email && !username){
        throw new ApiError(400,"enter username or email ")

    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user not found")
    }

    const isValidPassword = user.isPasswordCorrect(password);
    
    if(!isValidPassword){
        throw new ApiError(401,"invalid crediantials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:false
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new ApiResponse(200,{user:loggedInUser ,accessToken, refreshToken},'user logged in successfully'))


}) 

//logout
const logoutUser = asyncHandler(async(req,res)=>{
    
    // for logout i need to clear refresh token and cookies 
    //  for that i user's access is required but here i don't have that so 
    // creata a middleware which can provide access to user
    // see auth.middleware.js => jwtVerify 
    console.log(req.user)
    await User.findByIdAndUpdate(req.user._id,
        {  
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))


})

// get current user
const getCurrentUser= asyncHandler(async(req,res)=>{
    const user = User.findById(req.user._id);
    if(!user){
        throw new ApiError(404,"no user found")
    }

    return res.status(200).json(new ApiResponse(200,user,"user fetched"))
})



// refresh token
const refreshAccessToken =asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body;
    
    try {
        if(!incomingRefreshToken){
            throw new ApiError(404,"unauthorised token");
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);
        
        if(!decodedToken){
            throw new ApiError(404,"unauthorised token");
        }
    
        const user = await User.findById(decodedToken._id);
    
        if(user.refreshToken!==incomingRefreshToken){
            throw new ApiError(404,"token is expired");
    
        }

        const options={
            httpOnly:true,
            secure:true
        }

        const {accessToken,newRefreshToken} = generateAccessAndRefreshTokens(user._id);

        return res.status(200).cookie("access Token",accessToken,options).cookie("refresh Token",newRefreshToken,options).json(
            new ApiResponse(200,{accessToken, refreshToken:newRefreshToken},"new refresh Token generated")
        )
    
    } catch (error) {
        throw new ApiError(404,error);

    }
}) 

// change password
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} =  req.body;
    const user =await User.findById(req.user._id);

    if(oldPassword!==user.password){
        throw new ApiError(404, "wrong password entered");
    }

    user.password= newPassword;
    await user.save({validateBeforeSave:false});

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"))



})

// update account details
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {email,fullName,username } = req.body;

    if(!email && !fullName && !username) {
        throw new ApiError(401,"all fields are required");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new :true}
    ).select("-password -refreshtoken")

    res.status(200).json(new ApiResponse(200, {user},"account details updated successfully"))
})

// update avatar
const updateUserAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(401,"avatar file not found");

    }

    const avatar =await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(500, "something went wrong while uploading avatar");

    }
    const user =await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true   
        }
    ).select("-password")

    return res.status(200,user,"avatar uploaded successfully");

})

// update cover Image
const updateCoverImage= asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(401,"cover image file is missing");

    }

    const coverImage =await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,"something went wrong while uploading cover image to server")
    }

    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200,user,"cover image uploaded successfullty")
})

// pipelines
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const username = req.params
    if(!username?.trim()){
        throw new ApiError(401,"username missing");
    }

    const channel = User.aggregate([
        {
            $match:{
                username:username.toLowerCase()
            }

        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"

            }

        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedToChannel"
            }
        },
        {
            $addFields:{
                subscribers:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribesToChannel"
                },
                isSubscribed:{
                    if:{$in:[req.user._id,"subscriber"]},
                    then:true,
                    else:false
                }
            }
        },
        {
            $project:{
                fullName:1,
                subscribers:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                username:1,
                email:1

            }
        }
    ])

    if(!channel.length){
        throw new ApiError(404,"channel does not exists")
    }

    retrun 
    res.status(200)
    .json(new ApiResponse(200,channel[0]," channnel fetched successfullly "))

})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user = User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from :"Video",
                localField:"watchHistory",
                foreigField:_id,
                // as there is owner field in video model so another pipeline for it
                pipeline:[
                    {
                        $lookup:{
                            from:"User",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            // sending selected dat aform user 
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        },
                             
                    },
                    // overriding owner field in video model
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]

            }

        }
    ])

    res.status(200).json(new ApiResponse(200, user[0].watchHistory,"watch history feteched successfuly"))
})


export  {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, updateAccountDetails, updateUserAvatar, getUserChannelProfile, getWatchHistory}