import {upload} from "../middleWares/multer.middleware.js"
import { jwtVerify } from "../middleWares/auth.middleare.js";
import {Router} from "express"
import { uploadPhoto } from "../controllers/photo.controller.js";

import { receivePhoto } from "../controllers/photo.controller.js";

const photoRouter = Router();

// secured route
photoRouter
    .route("/upload")
    .post(jwtVerify,upload.single("photoFile"),uploadPhoto)

photoRouter
    .route("/receive")
    .get(receivePhoto)

export default photoRouter;