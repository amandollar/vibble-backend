# Vibble Backend API

A RESTful API backend for Vibble - a video streaming platform similar to YouTube, built with Node.js, Express.js, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Models](#database-models)
- [Error Handling](#error-handling)

## ✨ Features

### ✅ Implemented Features

1. **User Authentication**
   - User registration with avatar and cover image upload
   - User login with email/username
   - JWT-based authentication (Access Token + Refresh Token)
   - Token refresh mechanism
   - Secure logout with token invalidation
   - Password change functionality

2. **User Management**
   - Get current user details
   - Update user profile (fullName, avatar, coverImage)
   - Get user channel profile with subscription statistics
   - Watch history tracking

3. **File Upload**
   - Image uploads (avatar, cover image) using Multer
   - Cloudinary integration for cloud storage
   - Automatic file cleanup after upload

4. **Security**
   - Password hashing with bcrypt
   - HTTP-only cookies for token storage
   - CORS configuration
   - Secure cookie options

5. **Database**
   - MongoDB with Mongoose ODM
   - User model with watch history
   - Video model (schema defined)
   - Subscription model (schema defined)

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB with Mongoose v9.1.1
- **Authentication**: JSON Web Tokens (JWT)
- **File Upload**: Multer v2.0.2
- **Cloud Storage**: Cloudinary v2.8.0
- **Password Hashing**: bcrypt v6.0.0
- **Pagination**: mongoose-aggregate-paginate-v2

## 📁 Project Structure

```
vibble-backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── index.js               # Application entry point
│   ├── constants.js           # Application constants
│   ├── controllers/           # Route controllers
│   │   └── user.controller.js
│   ├── db/                    # Database configuration
│   │   └── db.js
│   ├── middlewares/           # Custom middlewares
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   ├── models/                # Mongoose models
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   └── subscription.model.js
│   ├── routes/                # API routes
│   │   └── user.routes.js
│   └── utils/                 # Utility functions
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       ├── cloudinary.js
│       └── GenerateToken..js
├── public/
│   └── temp/                  # Temporary file storage
├── package.json
└── README.md
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd vibble-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory
   - See [Environment Variables](#environment-variables) section for required variables

4. **Start the development server**

   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000` (or the port specified in `.env`)

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📡 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### User Routes (`/api/v1/users`)

| Method | Endpoint             | Description              | Auth Required |
| ------ | -------------------- | ------------------------ | ------------- |
| POST   | `/register`          | Register a new user      | ❌            |
| POST   | `/login`             | Login user               | ❌            |
| POST   | `/logout`            | Logout user              | ✅            |
| POST   | `/refresh`           | Refresh access token     | ❌            |
| PATCH  | `/change-password`   | Change user password     | ✅            |
| GET    | `/me`                | Get current user details | ✅            |
| PUT    | `/update`            | Update user profile      | ✅            |
| DELETE | `/delete`            | Delete user account      | ✅            |
| GET    | `/:username/channel` | Get channel profile      | ✅            |
| GET    | `/watch-history`     | Get user watch history   | ✅            |

### Request/Response Examples

#### Register User

```http
POST /api/v1/users/register
Content-Type: multipart/form-data

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "avatar": <file>,
  "coverImage": <file> (optional)
}
```

#### Login User

```http
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "john@example.com",  // or "username": "johndoe"
  "password": "password123"
}
```

#### Get Current User

```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived token (default: 1 day) sent in Authorization header or cookies
2. **Refresh Token**: Long-lived token (default: 10 days) stored in HTTP-only cookies

### How to Authenticate

1. Login or Register to get tokens
2. Include the access token in requests:
   - **Header**: `Authorization: Bearer <access_token>`
   - **Cookie**: Automatically sent if using cookies

3. If access token expires, use `/refresh` endpoint to get a new one

## 🗄 Database Models

### User Model

- `username` (unique, indexed, lowercase)
- `email` (unique, lowercase)
- `fullName` (indexed)
- `avatar` (required)
- `coverImage` (optional)
- `password` (hashed with bcrypt)
- `watchHistory` (array of Video references)
- `refreshToken`
- `timestamps` (createdAt, updatedAt)

### Video Model

- `videoFile` (Cloudinary URL)
- `thumbnail` (Cloudinary URL)
- `title`
- `description`
- `duration` (in seconds)
- `views` (default: 0)
- `isPublished` (default: true)
- `owner` (User reference)
- `timestamps`

### Subscription Model

- `subscriber` (User reference - who subscribes)
- `channel` (User reference - channel being subscribed to)
- `timestamps`

## ⚠️ Error Handling

The API uses a centralized error handling system:

- **ApiError**: Custom error class for API errors
- **ApiResponse**: Standardized response format
- **asyncHandler**: Wrapper for async route handlers

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```

### Success Response Format

```json
{
  "success": true,
  "message": "Success message",
  "statusCode": 200,
  "data": { ... }
}
```

## 🐛 Known Issues

1. **File Naming**: `GenerateToken..js` has double dots (should be `GenerateToken.js`)
2. **Missing Import**: `GenerateToken..js` is missing `ApiError` import
3. **Bug in getUserDetails**: Double `asyncHandler` wrapper
4. **Typo in refreshAccessToken**: `req.cookie` should be `req.cookies`
5. **Video & Subscription**: Models exist but no controllers/routes implemented yet

## 📝 Development Notes

- The application uses ES Modules (`"type": "module"` in package.json)
- File uploads are temporarily stored in `public/temp` before uploading to Cloudinary
- Passwords are automatically hashed before saving (using Mongoose pre-save hook)
- Usernames are automatically converted to lowercase for consistency

## 🤝 Contributing

This is a personal project. Feel free to fork and modify as needed.

## 📄 License

ISC License

---

**Author**: Aman Sharma  
**Version**: 1.0.0
