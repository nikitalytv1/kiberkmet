import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

const clientsByUser = new Map();

function addClient(userId, ws) {
  const key = String(userId);
  const clients = clientsByUser.get(key) ?? new Set();
  clients.add(ws);
  clientsByUser.set(key, clients);
  console.log(`[ws] User ${key} connected (${clients.size} active connection(s))`);

  ws.on("close", () => {
    clients.delete(ws);
    if (clients.size === 0) clientsByUser.delete(key);
    console.log(`[ws] User ${key} disconnected (${clients.size} active connection(s))`);
  });
}

function sendJson(ws, message) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(message));
}

export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  console.log("[ws] WebSocket server listening on /ws");

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      console.log("[ws] Rejected connection: missing token");
      ws.close(1008, "Missing token");
      return;
    }

    try {
      const user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      addClient(user.userId, ws);
      sendJson(ws, { type: "connected" });
    } catch {
      console.log("[ws] Rejected connection: invalid token");
      ws.close(1008, "Invalid token");
    }
  });
}

export function notifyUser(userId, message) {
  const clients = clientsByUser.get(String(userId));
  if (!clients) {
    console.log(`[ws] No active client for user ${userId}; event ${message.type} not sent`);
    return;
  }

  for (const ws of clients) {
    sendJson(ws, message);
  }

  console.log(`[ws] Sent ${message.type} to user ${userId} (${clients.size} active connection(s))`);
}
