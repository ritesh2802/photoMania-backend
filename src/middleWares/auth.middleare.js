import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"

export  const jwtVerify=asyncHandler(async(req,res,next)=>{
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        if(!token){
            throw new ApiError(401,"unauthorisded request");
        }

        const decodedToken = jwt.verify(token,"chai-aur-code")
        console.log("decodedToken?._id", decodedToken?._id)
        const user = User.findById(decodedToken?._id);
        console.log("user in m iddleware", user)

        console.log("user ki id in m iddleware", user._conditions._id)
        if(!user){
            throw new ApiError(401,"invalid acceess token");
        }

        req.user = user; //new key is added in req object named user ; with value of user
        next();


       

    }
    catch(err){
        throw new ApiError(404,err?.message||"invalid access token")
    }
})