import express, { Application, NextFunction, Request, Response } from "express";

import httpStatus from "http-status";
import cors from "cors";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { PrismaClient } from "@prisma/client";
import path from "path";
import redis from "./helpers/redis";

const app: Application = express();
const prisma = new PrismaClient();

// Middleware setup
prisma
  .$connect()
  .then(() => {
    console.log("✅ Database connected successfully!");
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });
redis;

const subscriber = redis.duplicate(); // Create a new Redis connection for subscribing

// Subscribe to the locationUpdates channel
subscriber.subscribe("locationUpdates");

subscriber.on("message", (channel, message) => {
  if (channel === "userLocationUpdates") {
    const locationData = JSON.parse(message);
    console.log("Live Location Update:", locationData);
  }
});

app.get("/driver-location/:driverId", async (req, res) => {
  const { driverId } = req.params;

  const location = await redis.get(`user:${driverId}:location`);

  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }

  res.json(JSON.parse(location));
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Route handler for root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Welcome to api main route",
  });
});

// Router setup
app.use("/api/v1", router);

// Global Error Handler
app.use(GlobalErrorHandler);

// API Not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
