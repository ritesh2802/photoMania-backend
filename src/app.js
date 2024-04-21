import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
    origin:"*",
    credetials:true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb","extended":true}))
app.use(express.static("public"))
app.use(cookieParser());

// import routes


import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users",userRouter)

import photoRouter from "./routes/photo.routes.js";
app.use("/api/v1/photos",photoRouter)
// http://localhost:8000/api/v1/users/register
// http://localhost:8000/api/v1/photos/upload


export {app}
