import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import morganBody from "morgan-body";
import bodyParser from "body-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cookieParser());
morganBody(app);


app.get("/health", (_req, res) => {
  res.status(200).json({
    message: "Vibble v1 backend running",
  });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.log(err);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server error",
  });
});



export { app };
