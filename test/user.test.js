import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../src/app.js";
import { User } from "../src/models/user.model.js";
import generateAccessAndRefreshTokens from "../src/utils/GenerateToken.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("User Routes Tests", () => {
  let testUser;
  let accessToken;
  let refreshToken;
  let testAvatarPath;

  beforeAll(async () => {
    // Set up test environment variables if not set
    if (!process.env.ACCESS_TOKEN_SECRET) {
      process.env.ACCESS_TOKEN_SECRET = "test-access-token-secret-key-for-testing";
    }
    if (!process.env.REFRESH_TOKEN_SECRET) {
      process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret-key-for-testing";
    }
    if (!process.env.ACESS_TOKEN_EXPIRY) {
      process.env.ACESS_TOKEN_EXPIRY = "1d";
    }
    if (!process.env.REFRESH_TOKEN_EXPIRY) {
      process.env.REFRESH_TOKEN_EXPIRY = "10d";
    }

    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017", {
        dbName: "vibble-test-db",
      });
    }

    // Setup test avatar file path
    testAvatarPath = path.join(__dirname, "../public/temp/test/avatar.jpg");
    
    // Ensure test file exists
    const testDir = path.dirname(testAvatarPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(testAvatarPath)) {
      // Create a dummy image file for testing
      fs.writeFileSync(testAvatarPath, Buffer.from("fake image data"));
    }
  });

  afterAll(async () => {
    // Clean up test database
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
  });

  describe("POST /api/v1/users/login", () => {
    beforeEach(async () => {
      // Create a test user for login tests
      testUser = await User.create({
        fullName: "Login Test User",
        email: "login@example.com",
        username: "logintest",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });
    });

    it("should login user with email successfully", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "login@example.com",
          password: "password123",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should login user with username successfully", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          username: "logintest",
          password: "password123",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should return 400 if neither email nor username provided", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          password: "password123",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 if user does not exist", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 if password is incorrect", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "login@example.com",
          password: "wrongpassword",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/users/logout", () => {
    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        fullName: "Logout Test User",
        email: "logout@example.com",
        username: "logouttest",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    });

    it("should logout user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/users/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("logged out");

      // Verify refresh token is cleared
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.refreshToken).toBeUndefined();
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).post("/api/v1/users/logout");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/users/refresh", () => {
    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        fullName: "Refresh Test User",
        email: "refresh@example.com",
        username: "refreshtest",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    });

    it("should refresh access token successfully with cookie", async () => {
      const response = await request(app)
        .post("/api/v1/users/refresh")
        .set("Cookie", `refreshAccessToken=${refreshToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should refresh access token successfully with body", async () => {
      const response = await request(app)
        .post("/api/v1/users/refresh")
        .send({
          refreshAccessToken: refreshToken,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("accessToken");
    });

    it("should return 401 if refresh token is missing", async () => {
      const response = await request(app).post("/api/v1/users/refresh");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/users/change-password", () => {
    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        fullName: "Password Test User",
        email: "password@example.com",
        username: "passwordtest",
        password: "oldpassword123",
        avatar: "https://example.com/avatar.jpg",
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
    });

    it("should change password successfully", async () => {
      const response = await request(app)
        .patch("/api/v1/users/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "oldpassword123",
          newPassword: "newpassword123",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Password changed");

      // Verify new password works
      const updatedUser = await User.findById(testUser._id);
      const isNewPasswordCorrect = await updatedUser.isPasswordCorrect(
        "newpassword123"
      );
      expect(isNewPasswordCorrect).toBe(true);
    });

    it("should return 400 if fields are missing", async () => {
      const response = await request(app)
        .patch("/api/v1/users/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "oldpassword123",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 if old password is incorrect", async () => {
      const response = await request(app)
        .patch("/api/v1/users/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: "wrongpassword",
          newPassword: "newpassword123",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app)
        .patch("/api/v1/users/change-password")
        .send({
          oldPassword: "oldpassword123",
          newPassword: "newpassword123",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/users/me", () => {
    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        fullName: "Get User Test",
        email: "getuser@example.com",
        username: "getusertest",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
    });

    it("should get current user details successfully", async () => {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.email).toBe("getuser@example.com");
      expect(response.body.data).not.toHaveProperty("password");
      expect(response.body.data).not.toHaveProperty("refreshToken");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/v1/users/me");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/users/delete", () => {
    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        fullName: "Delete Test User",
        email: "delete@example.com",
        username: "deletetest",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
    });

    it("should return message that deletion is not allowed", async () => {
      const response = await request(app)
        .delete("/api/v1/users/delete")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("don't allow");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).delete("/api/v1/users/delete");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/users/:username/channel", () => {
    let channelUser;

    beforeEach(async () => {
      // Create a channel user
      channelUser = await User.create({
        fullName: "Channel Owner",
        email: "channel@example.com",
        username: "channelowner",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      // Create and login a test user to view channel
      testUser = await User.create({
        fullName: "Viewer User",
        email: "viewer@example.com",
        username: "vieweruser",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
    });

    it("should get channel profile successfully", async () => {
      const response = await request(app)
        .get(`/api/v1/users/${channelUser.username}/channel`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("username", "channelowner");
      expect(response.body.data).toHaveProperty("subscriberCount");
      expect(response.body.data).toHaveProperty("channelSubscribedToCount");
      expect(response.body.data).toHaveProperty("isSubscribed");
    });

    it("should return 404 if channel not found", async () => {
      const response = await request(app)
        .get("/api/v1/users/nonexistentuser/channel")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get(
        `/api/v1/users/${channelUser.username}/channel`
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/users/watch-history", () => {
    beforeEach(async () => {
      // Create and login a test user
      testUser = await User.create({
        fullName: "Watch History Test User",
        email: "watchhistory@example.com",
        username: "watchhistorytest",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
        watchHistory: [],
      });

      const tokens = await generateAccessAndRefreshTokens(testUser._id);
      accessToken = tokens.accessToken;
    });

    it("should get watch history successfully", async () => {
      const response = await request(app)
        .get("/api/v1/users/watch-history")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/v1/users/watch-history");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
