# Vibble API Documentation

This document lists all the available API endpoints for the Vibble backend.

## Base URL

`https://<your-domain>/api/v1`

---

## Health Check

### Get Backend Status

Check if the backend server is running.

- **URL:** `/health` (Note: This is outside the `/api/v1` prefix)
- **Method:** `GET`
- **Auth Required:** No
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "Vibble v1 backend running" }`

---

## User Endpoints

### Register User

Create a new user account.

- **URL:** `/users/register`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body (Multipart/Form-Data):**
  - `fullName`: string (required)
  - `email`: string (required)
  - `username`: string (required)
  - `password`: string (required)
  - `avatar`: file (required)
  - `coverImage`: file (optional)
- **Success Response:**
  - **Code:** 201
  - **Content:** User object (excluding password and refreshToken)

### Login User

Authenticate a user and receive access/refresh tokens.

- **URL:** `/users/login`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body (JSON):**
  - `email`: string (optional if username provided)
  - `username`: string (optional if email provided)
  - `password`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "user": { ... }, "accessToken": "...", "refreshToken": "..." }`
  - **Cookies:** Sets `accessToken` and `refreshToken` cookies.

### Logout User

Log out the currently authenticated user.

- **URL:** `/users/logout`
- **Method:** `POST`
- **Auth Required:** Yes
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "success": true, "message": "User logged out" }`

### Refresh Access Token

Get a new access token using a refresh token.

- **URL:** `/users/refresh`
- **Method:** `POST`
- **Auth Required:** No (requires `refreshToken` in cookies or body)
- **Request Body (JSON):**
  - `refreshAccessToken`: string (optional if cookie exists)
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "accessToken": "...", "refreshToken": "..." }`

### Change Password

Update the password for the current user.

- **URL:** `/users/change-password`
- **Method:** `PATCH`
- **Auth Required:** Yes
- **Request Body (JSON):**
  - `oldPassword`: string (required)
  - `newPassword`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "success": true, "message": "Password changed successfully" }`

### Get Current User Details

Fetch details of the currently logged-in user.

- **URL:** `/users/me`
- **Method:** `GET`
- **Auth Required:** Yes
- **Success Response:**
  - **Code:** 200
  - **Content:** Current user object

### Update User Details

Update the profile information of the current user.

- **URL:** `/users/update`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Request Body (Multipart/Form-Data):**
  - `fullName`: string (optional)
  - `avatar`: file (required)
  - `coverImage`: file (optional)
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated user object

### Delete User

Delete the current user account (currently disabled by the backend).

- **URL:** `/users/delete`
- **Method:** `DELETE`
- **Auth Required:** Yes
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "We don't allow to delete your account :) " }`

### Get User Channel Profile

Fetch the public profile of a user by their username.

- **URL:** `/users/:username/channel`
- **Method:** `GET`
- **Auth Required:** Yes
- **Path Variables:**
  - `username`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** Channel profile object (includes subscriber counts and subscription status)

### Get Watch History

Fetch the watch history for the current user.

- **URL:** `/users/watch-history`
- **Method:** `GET`
- **Auth Required:** Yes
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of video objects in watch history

---

## Video Endpoints

### Upload Video

Upload a new video with thumbnail.

- **URL:** `/videos/upload`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body (Multipart/Form-Data):**
  - `videoFile`: file (required)
  - `thumbnail`: file (required)
  - `title`: string (required)
  - `description`: string (required)
  - `duration`: number (required, in seconds)
- **Success Response:**
  - **Code:** 201
  - **Content:** Video object

### Get Video by ID

Fetch a single video by its ID.

- **URL:** `/videos/:videoId`
- **Method:** `GET`
- **Auth Required:** No
- **Path Variables:**
  - `videoId`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** Video object with owner details

### Update Video

Update video details (title, description, thumbnail).

- **URL:** `/videos/:videoId`
- **Method:** `PATCH`
- **Auth Required:** Yes (Owner only)
- **Path Variables:**
  - `videoId`: string (required)
- **Request Body (Multipart/Form-Data):**
  - `title`: string (optional)
  - `description`: string (optional)
  - `thumbnail`: file (optional)
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated video object

### Delete Video

Delete a video permanently.

- **URL:** `/videos/:videoId`
- **Method:** `DELETE`
- **Auth Required:** Yes (Owner only)
- **Path Variables:**
  - `videoId`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "Video deleted successfully" }`

### Toggle Publish Status

Toggle the publish/unpublish status of a video.

- **URL:** `/videos/:videoId/toggle-publish`
- **Method:** `PATCH`
- **Auth Required:** Yes (Owner only)
- **Path Variables:**
  - `videoId`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated video object

### Get All Videos

Fetch all published videos with pagination and optional filters.

- **URL:** `/videos`
- **Method:** `GET`
- **Auth Required:** No
- **Query Parameters:**
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
  - `sortBy`: string (optional, default: "createdAt")
  - `sortType`: string (optional, "asc" or "desc", default: "desc")
  - `query`: string (optional, search term)
  - `userId`: string (optional, filter by user/channel)
- **Success Response:**
  - **Code:** 200
  - **Content:** Paginated array of video objects

### Get Videos by User/Channel

Fetch all videos from a specific user/channel.

- **URL:** `/videos/channel/:userId`
- **Method:** `GET`
- **Auth Required:** No
- **Path Variables:**
  - `userId`: string (required)
- **Query Parameters:**
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
- **Success Response:**
  - **Code:** 200
  - **Content:** Paginated array of video objects

### Search Videos

Search videos by title or description.

- **URL:** `/videos/search`
- **Method:** `GET`
- **Auth Required:** No
- **Query Parameters:**
  - `query`: string (required)
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
- **Success Response:**
  - **Code:** 200
  - **Content:** Paginated array of matching video objects

### Get Trending Videos

Fetch trending videos from the last 7 days, sorted by views.

- **URL:** `/videos/trending`
- **Method:** `GET`
- **Auth Required:** No
- **Query Parameters:**
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
- **Success Response:**
  - **Code:** 200
  - **Content:** Paginated array of trending video objects

### Increment Video Views

Increment the view count for a video.

- **URL:** `/videos/:videoId/view`
- **Method:** `POST`
- **Auth Required:** No (but adds to watch history if authenticated)
- **Path Variables:**
  - `videoId`: string (required)
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "views": <updated_view_count> }`

### Get Recommended Videos

Get personalized video recommendations based on watch history.

- **URL:** `/videos/recommended/feed`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Parameters:**
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)
- **Success Response:**
  - **Code:** 200
  - **Content:** Paginated array of recommended video objects
