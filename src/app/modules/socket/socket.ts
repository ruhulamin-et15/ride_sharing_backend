import { WebSocketServer, WebSocket } from "ws";
import prisma from "../../../shared/prisma";

const channelClients = new Map<string, Set<WebSocket>>();

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established!");

    // Ping the client every 30 seconds to keep the connection alive
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    let subscribeRoom: string | null = null;

    ws.on("message", async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        const {
          type,
          userId,
          driverId,
          roomID,
          message: msgContent,
        } = parsedMessage;

        if (type === "subscribe") {
          if (!userId || !driverId) {
            ws.send(
              JSON.stringify({
                error: "userId and driverId are required to subscribe",
              })
            );
            return;
          }

          // Find or create the chat room
          const room = await prisma.room.upsert({
            where: { userId_driverId: { userId, driverId } },
            create: { userId, driverId },
            update: {},
          });

          const roomId = room.id;

          // Unsubscribe from the previous room
          if (subscribeRoom) {
            const previousSet = channelClients.get(subscribeRoom);
            previousSet?.delete(ws);
            if (previousSet?.size === 0) channelClients.delete(subscribeRoom);
          }

          // Subscribe to the new room
          if (!channelClients.has(roomId)) {
            channelClients.set(roomId, new Set());
          }
          channelClients.get(roomId)?.add(ws);
          subscribeRoom = roomId;

          // Retrieve past messages
          const pastMessages = await prisma.message.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" },
          });

          // Send past messages to the client
          ws.send(
            JSON.stringify({
              type: "pastMessages",
              roomId,
              messages: pastMessages,
            })
          );
        } else if (
          type === "send-message" &&
          subscribeRoom &&
          userId &&
          driverId
        ) {
          // Ensure the user is in the subscribed room
          if (roomID !== subscribeRoom) {
            ws.send(
              JSON.stringify({ error: "You are not subscribed to this room" })
            );
            return;
          }

          // Save message to the database
          const newMessage = await prisma.message.create({
            data: {
              roomId: roomID,
              userId: userId,
              driverId: driverId,
              message: msgContent,
            },
          });

          // Broadcast message to all clients in the room
          const messagePayload = {
            type: "message",
            roomId: roomID,
            message: newMessage,
          };

          channelClients.get(roomID)?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messagePayload));
            }
          });
        }
      } catch (err: any) {
        console.error("Error processing WebSocket message:", err.message);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      if (subscribeRoom) {
        const clientsInChannel = channelClients.get(subscribeRoom);
        clientsInChannel?.delete(ws);
        if (clientsInChannel?.size === 0) channelClients.delete(subscribeRoom);
      }
      console.log("WebSocket client disconnected!");
      clearInterval(interval);
    });
  });

  return wss;
}
