import { describe, expect, jest } from "@jest/globals";

// 1. Mock modules BEFORE importing anything else that depends on them
jest.unstable_mockModule("../src/utils/cloudinary.js", () => ({
  uploadOnCloudinary: jest.fn().mockImplementation((path) => {
    if (path.includes("fail")) return null;
    return Promise.resolve({
      url: "https://mock-cloudinary.com/video-or-thumb.file",
      duration: 120.5,
    });
  }),
}));

// 2. Dynamically import modules that use the mocked dependency
const { app } = await import("../src/app.js");
const { User } = await import("../src/models/user.model.js");
const { Video } = await import("../src/models/video.model.js");
const { default: generateAccessAndRefreshTokens } =
  await import("../src/utils/GenerateToken.js");

import request from "supertest";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Video Controller Tests", () => {
  let accessToken;
  let otherUserToken;
  let testUser;
  let otherUser;
  const testVideoPath = path.join(__dirname, "test-video.mp4");
  const testThumbnailPath = path.join(__dirname, "test-thumbnail.jpg");

  beforeAll(async () => {
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
    process.env.ACCESS_TOKEN_EXPIRY = "1d";
    process.env.REFRESH_TOKEN_EXPIRY = "10d";

    process.env.CLOUDINARY_CLOUD_NAME = "test";
    process.env.CLOUDINARY_API_KEY = "test";
    process.env.CLOUDINARY_API_SECRET = "test";

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/vibble-test"
    );

    fs.writeFileSync(testVideoPath, "fake video content");
    fs.writeFileSync(testThumbnailPath, "fake image content");
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Video.deleteMany({});
    await mongoose.connection.close();

    if (fs.existsSync(testVideoPath)) fs.unlinkSync(testVideoPath);
    if (fs.existsSync(testThumbnailPath)) fs.unlinkSync(testThumbnailPath);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Video.deleteMany({});

    testUser = await User.create({
      fullName: "Tester",
      email: "test@test.com",
      username: "tester",
      password: "password123",
      avatar: "http://avatar.com",
    });

    otherUser = await User.create({
      fullName: "Other Tester",
      email: "other@vibble.com",
      username: "othertester",
      password: "password123",
      avatar: "http://avatar.com/other",
    });

    const tokens = await generateAccessAndRefreshTokens(testUser._id);
    accessToken = tokens.accessToken;

    const otherTokens = await generateAccessAndRefreshTokens(otherUser._id);
    otherUserToken = otherTokens.accessToken;
  });

  // upload video
  describe("POST /api/v1/videos/upload", () => {
    it("should successfully upload a video", async () => {
      const response = await request(app)
        .post("/api/v1/videos/upload")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "my first video")
        .field("description", "Testing is fun")
        .attach("videoFile", testVideoPath)
        .attach("thumbnail", testThumbnailPath);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.title).toBe("my first video");

      const videoInDb = await Video.findOne({ title: "my first video" });
      expect(videoInDb).toBeDefined();
      expect(videoInDb.owner.toString()).toBe(testUser._id.toString());
      expect(videoInDb.duration).toBe(120);
    });

    it("should fail if title is missing", async () => {
      const response = await request(app)
        .post("/api/v1/videos/upload")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("description", "Missing title")
        .attach("videoFile", testVideoPath)
        .attach("thumbnail", testThumbnailPath);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain("required");
    });
  });

  // get video by id
  describe("GET /api/v1/videos/:videoId", () => {
    it("should fetch a video by ID", async () => {
      const video = await Video.create({
        title: "Existing Video",
        description: "Desc",
        videoFile: "http://video.com",
        thumbnail: "http://thumb.com",
        duration: 100,
        owner: testUser._id,
      });
      const response = await request(app).get(`/api/v1/videos/${video._id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.title).toBe("Existing Video");
    });
  });

  // update video
  describe("PATCH /api/v1/videos/:videoId", () => {
    let video;
    beforeEach(async () => {
      video = await Video.create({
        title: "Old Title",
        description: "Old Desc",
        videoFile: "http://video.com",
        thumbnail: "http://thumb.com",
        duration: 100,
        owner: testUser._id,
      });
    });

    it("should update video title and description (owner only)", async () => {
      const response = await request(app)
        .patch(`/api/v1/videos/${video._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "New Title")
        .field("description", "New Desc");

      expect(response.statusCode).toBe(200);
      expect(response.body.data.title).toBe("New Title");
      expect(response.body.data.description).toBe("New Desc");
    });

    it("Should fail if another user tries to update the video (Authorization)", async () => {
      const response = await request(app)
        .patch(`/api/v1/videos/${video._id}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .field("title", "Hack attempt");

      expect(response.statusCode).toBe(403);
    });
  });

  // delete video
  describe("DELETE /api/v1/videos/:videoId", () => {
    it("should delete video by owner", async () => {
      const video = await Video.create({
        title: "Delete Me",
        description: "Bye bye",
        videoFile: "http://file.com",
        thumbnail: "http://thumb.com",
        duration: 10,
        owner: testUser._id,
      });

      const response = await request(app)
        .delete(`/api/v1/videos/${video._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      const videoInDb = await Video.findById(video._id);
      expect(videoInDb).toBeNull();
    });
  });

  // toggle publish status:
  describe("PATCH /api/v1/videos/:videoId/toggle-publish", () => {
    it("should flip the isPublished status", async () => {
      const video = await Video.create({
        title: "Toggle Video",
        description: "Toggle test",
        videoFile: "http://file.com",
        thumbnail: "http://thumb.com",
        duration: 10,
        owner: testUser._id,
        isPublished: true,
      });

      const response = await request(app)
        .patch(`/api/v1/videos/${video._id}/toggle-publish`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.isPublished).toBe(false);
    });
  });

  // get all videos (pagination & query)
  describe("GET /api/v1/videos/", () => {
    it("should fetch all published videos with pagination", async () => {
      await Video.insertMany([
        {
          title: "Video 1",
          description: "D1",
          videoFile: "f1",
          thumbnail: "t1",
          duration: 1,
          owner: testUser._id,
          isPublished: true,
        },
        {
          title: "Video 2",
          description: "D2",
          videoFile: "f2",
          thumbnail: "t2",
          duration: 1,
          owner: testUser._id,
          isPublished: true,
        },
        {
          title: "Private Video",
          description: "D3",
          videoFile: "f3",
          thumbnail: "t3",
          duration: 1,
          owner: testUser._id,
          isPublished: false,
        },
      ]);

      const response = await request(app).get(
        "/api/v1/videos/?page=1&limit=10"
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.data.docs.length).toBe(2); //shows only published
      expect(response.body.data.totalDocs).toBe(2);
    });

    it("should filter videos by search query", async () => {
      await Video.insertMany([
        {
          title: "Funny Cats",
          description: "Cats playing",
          videoFile: "f1",
          thumbnail: "t1",
          duration: 1,
          owner: testUser._id,
          isPublished: true,
        },
        {
          title: "Cooking Tutorial",
          description: "Make pasta",
          videoFile: "f2",
          thumbnail: "t2",
          duration: 1,
          owner: testUser._id,
          isPublished: true,
        },
      ]);

      const response = await request(app).get("/api/v1/videos/?query=cats");
      expect(response.body.data.docs[0].title).toBe("Funny Cats");
      expect(response.statusCode).toBe(200);
      expect(response.body.data.docs.length).toBe(1);
    });
  });

  // increment views
  describe("POST /api/v1/videos/:videoId/view", () => {
    it("should increment view count and update watch history if user is logged in", async () => {
      const video = await Video.create({
        title: "View Boost",
        description: "Boost me",
        videoFile: "http://file.com",
        thumbnail: "http://thumb.com",
        duration: 10,
        owner: testUser._id,
        views: 5,
      });

      const response = await request(app)
        .post(`/api/v1/videos/${video._id}/view`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.views).toBe(6);

      const userInDb = await User.findById(testUser._id);
      expect(userInDb.watchHistory.map((id) => id.toString())).toContain(
        video._id.toString()
      );
    });
  });

  // search videos
  describe("GET /api/v1/videos/search", () => {
    it("should return matches for a search query", async () => {
      await Video.create({
        title: "MERN Stack Course",
        description: "Full course",
        videoFile: "f1",
        thumbnail: "t1",
        duration: 1,
        owner: testUser._id,
        isPublished: true,
      });

      const response = await request(app).get(
        "/api/v1/videos/search?query=MERN"
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.data.docs[0].title).toBe("MERN Stack Course");
    });
  });

  // trending videos
  describe("GET /api/v1/videos/trending", () => {
    it("should fetch videos sorted by views", async () => {
      await Video.insertMany([
        {
          title: "Viral",
          description: "Viral video",
          views: 1000,
          videoFile: "f1",
          thumbnail: "t1",
          duration: 1,
          owner: testUser._id,
          isPublished: true,
        },
        {
          title: "Normal",
          description: "Normal video",
          views: 10,
          videoFile: "f2",
          thumbnail: "t2",
          duration: 1,
          owner: testUser._id,
          isPublished: true,
        },
      ]);

      const response = await request(app).get("/api/v1/videos/trending");

      expect(response.statusCode).toBe(200);
      expect(response.body.data.docs[0].title).toBe("Viral");
    });
  });
});
