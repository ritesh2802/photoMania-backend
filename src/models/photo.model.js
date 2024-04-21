import mongoose ,{Schema } from "mongoose";

const photoSchema= new Schema(
    {
        title:{
            type:String
        },
        photoFile:{
            type:String, //cloudinary url
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

export const Photo = mongoose.model("Photo",photoSchema)