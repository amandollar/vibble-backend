import { Router } from "express";
import {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
  getVideosByUser,
  searchVideos,
  getTrendingVideos,
  incrementVideoViews,
  getRecommendedVideos,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorize } from "../middlewares/auth.middleware.js";

const videoRouter = Router();

// Public
videoRouter.get("/", getAllVideos);
videoRouter.get("/search", searchVideos);
videoRouter.get("/trending", getTrendingVideos);
videoRouter.get("/:videoId", getVideoById);
videoRouter.post("/:videoId/view", incrementVideoViews);

// Protected
videoRouter.post(
  "/upload",
  authorize,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);

videoRouter.patch(
  "/:videoId",
  authorize,
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  updateVideo
);

videoRouter.delete("/:videoId", authorize, deleteVideo);
videoRouter.patch("/:videoId/toggle-publish", authorize, togglePublishStatus);
videoRouter.get("/channel/:userId", getVideosByUser);
videoRouter.get("/recommended/feed", authorize, getRecommendedVideos);

export default videoRouter;
