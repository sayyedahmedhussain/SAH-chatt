import { Server } from "socket.io";

let io;

const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);

    socket.on("join", (userId) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      io.emit("onlineUsers", [...onlineUsers.keys()]);
    });

    // Typing indicator relay — works for both a single receiver (1-1 chat)
    // and multiple receivers (group chat)
    socket.on("typing", ({ conversationId, receiverId, receiverIds }) => {
      const targets = receiverIds?.length ? receiverIds : [receiverId];
      targets.filter(Boolean).forEach((id) => {
        const receiverSocketId = onlineUsers.get(id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
    });

    socket.on("stopTyping", ({ conversationId, receiverId, receiverIds }) => {
      const targets = receiverIds?.length ? receiverIds : [receiverId];
      targets.filter(Boolean).forEach((id) => {
        const receiverSocketId = onlineUsers.get(id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("stopTyping", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log("🔴 User Disconnected:", socket.id);
      io.emit("onlineUsers", [...onlineUsers.keys()]);
    });
  });

  return io;
};

export const getIO = () => io;
export const getOnlineUsers = () => onlineUsers;
