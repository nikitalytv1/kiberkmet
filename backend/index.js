import express from "express";
import cors from "cors";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import userRoutes from "./routes/users.routes.js";
import parceleRoutes from './routes/parcele.routes.js';
import soilRoutes from "./routes/soil.js";
import statisticsRoutes from "./routes/statistics.js";

BigInt.prototype.toJSON = function() {
  return this.toString();
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

const app = express();
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
