// backend/src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";
import companyRoutes from "./routes/companyRoutes";
import authRoutes from "./routes/authRoutes";
import machineRoutes from "./routes/machineRoutes";
import usageRoutes from "./routes/usageRoutes";
import publicRoutes from "./routes/publicRoutes";
import queueRoutes from "./routes/queueRoutes"; // 🔥 ADICIONADO
import { openDb } from "./database";
import http from "http";
import { initSocket } from "./socket";
import { BackgroundJobs } from "./services/backgroundJobs";

// Carregar variáveis de ambiente
dotenv.config();

// Verificação de variáveis de ambiente críticas
if (!process.env.JWT_SECRET) {
  console.error("❌ Variável de ambiente JWT_SECRET não definida. O servidor não pode iniciar com segurança.");
  process.exit(1);
}

const app = express();

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    error: "Muitas tentativas, tente novamente em 15 minutos"
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota de saúde
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API LavaJá funcionando",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// Rotas da API
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/queue", queueRoutes); // 🔥 ADICIONADO

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Crie o servidor HTTP a partir do app Express
const server = http.createServer(app);

// Inicialize o Socket.IO
initSocket(server);

openDb().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`💡 Servidor WebSocket conectado`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);

    // Iniciar background jobs
    BackgroundJobs.start();
  });
}).catch(err => {
  console.error("❌ Erro ao conectar com o banco de dados:", err);
  process.exit(1);
});