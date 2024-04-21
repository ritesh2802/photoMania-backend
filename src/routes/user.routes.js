import {Router} from "express"
import {refreshAccessToken, loginUser, logoutUser, registerUser} from "../controllers/user.controller.js"
import {upload} from "../middleWares/multer.middleware.js"
import { jwtVerify } from "../middleWares/auth.middleare.js";

const userRouter = Router();
// register
userRouter
    .route("/register")
    .post(
        upload.fields([
            {
                name:"avatar",
                maxCount:1
            },
            {
                name:"coverImage",
                maxCount:1
            }
        ]),
        registerUser
    )

userRouter
    .route("/login")
    .post(loginUser)

// secured routes
userRouter
    .route("/logout")
    .post(jwtVerify,logoutUser)

userRouter
    .route("/refreshToken")
    .post(refreshAccessToken)





export default userRouter