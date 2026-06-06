import express from "express";
import cors from "cors";
import { createServer } from "http";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import userRoutes from "./routes/users.routes.js";
import parceleRoutes from './routes/parcele.routes.js';
import soilRoutes from "./routes/soil.routes.js";
import statisticsRoutes from "./routes/statistics.routes.js";
import regionRoutes from "./routes/regions.routes.js";
import { initWebSocketServer } from "./websocket.js";

BigInt.prototype.toJSON = function() {
  return this.toString();
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

const app = express();
const server = createServer(app);
initWebSocketServer(server);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API dela", routes: ["/api/health", "/api/users", "/api/parcele", "/api/soil"] });
});

app.get("/api/health", async (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use('/api/parcele', parceleRoutes);
app.use("/api/soil", soilRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/regions", regionRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
