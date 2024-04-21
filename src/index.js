import connectDB from "../src/db/index.js"
import dotenv from "dotenv"
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})

connectDB()
    .then(()=>{
        app.listen(process.env.PORT||9000,()=>{
            console.log(`server is listening at port: ${process.env.PORT}`)
        })
    })
    .catch((err)=>{
        console.log("err",err)
    })