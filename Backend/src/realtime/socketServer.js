const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const createSocketServer = (server, app) => {
  const allowedOrigins = (process.env.SOCKET_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(server, {
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Socket origin is not allowed."));
      },
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || !process.env.JWT_SECRET) return next(new Error("Authentication required."));

      const claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: "mauval-print" });
      if (!claims.sub) return next(new Error("Invalid access token."));

      const [users] = await app.locals.pool.query(
        "SELECT user_id, role, status FROM users WHERE user_id = ? LIMIT 1",
        [claims.sub]
      );
      const user = users[0];
      if (!user || user.status !== "active" || user.role !== claims.role) {
        return next(new Error("Account is inactive or authorization has changed."));
      }

      socket.data.identity = { userId: user.user_id, role: user.role };
      next();
    } catch (error) {
      next(new Error(error.name === "TokenExpiredError" ? "Access token expired." : "Invalid access token."));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.data.identity;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
  });

  app.set("io", io);
  return io;
};

module.exports = { createSocketServer };