import mongoose,{Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new  Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true //for searching purpose
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinery url
            required:false
        },
        coverImage:{
            type:String //cloudinery url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]

        },
        refreshToken:{
            type:String
        }
    },
    {timestamps:true}
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password= bcrypt.hash(this.password,11)
    next();
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken= function(){
   return  jwt.sign(
        {
            _id:this._id,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken= function(){
    return  jwt.sign(
         {
             _id:this._id,
             email:this.email
         },
         process.env.REFRESH_TOKEN_SECRET,
         {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY
         }
     )
 }
 



export const User = mongoose.model("User",userSchema)