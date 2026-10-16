require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const slotRoutes = require("./routes/slotRoutes");
const doctorScheduleRoutes = require("./routes/doctorScheduleRoutes");

const app = express();
const server = http.createServer(app);


const jwt = require("jsonwebtoken");

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Access token is required"));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    if (!decoded.userId || !decoded.role) {
      return next(new Error("Invalid access token"));
    }

    socket.data.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new Error("Invalid or expired access token"));
  }
});

io.on("connection", (socket) => {
  const { userId, role } = socket.data.user;

  // Private room for this authenticated user.
  socket.join(`user:${userId}`);

  // Shared room for this role.
  socket.join(`role:${role}`);

  console.log(`Authenticated Socket.IO client connected: ${role}`);
});


app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// Existing API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/schedules", scheduleRoutes);
app.use("/api/v1/slots", slotRoutes);

// Doctor schedule management routes
app.use(
  "/api/v1/doctor-schedules",
  doctorScheduleRoutes
);

// Health check
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "EMR API is running",
  });
});

app.set("io", io);

async function startServer() {
  try {
    await connectDB();

    server.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on port ${process.env.PORT || 5000}`
      );
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();