import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getUserDetails,
  updateUserDetails,
  deleteUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorize } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
userRouter.post("/login",loginUser);
userRouter.post("/logout",authorize, logoutUser);
userRouter.post("/refresh",refreshAccessToken);
userRouter.patch('/change-password',authorize,changePassword);
userRouter.put(
  "/update",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  authorize,
  updateUserDetails
);
userRouter.get('/me',authorize,getUserDetails);
userRouter.delete('/delete',authorize,deleteUser);

export default userRouter;
