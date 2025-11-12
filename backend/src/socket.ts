import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { getMachineStatus } from './services/machineStatusService';
import { MachineQueueModel } from '../src/models/MachineQueue';

let io: SocketIOServer;

export const initSocket = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Novo cliente conectado:', socket.id);

    socket.on('subscribe', ({ machineId, userId }) => {
      if (machineId) {
        console.log(`Cliente ${socket.id} se inscreveu na máquina ${machineId}`);
        socket.join(String(machineId));
      }
      if (userId) {
        console.log(`Cliente ${socket.id} se inscreveu no seu canal de usuário ${userId}`);
        socket.join(`user_${userId}`);
      }
    });

    socket.on('unsubscribe', ({ machineId, userId }) => {
      if (machineId) {
        console.log(`Cliente ${socket.id} se desinscreveu da máquina ${machineId}`);
        socket.leave(String(machineId));
      }
      if (userId) {
        console.log(`Cliente ${socket.id} se desinscreveu do seu canal de usuário ${userId}`);
        socket.leave(`user_${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const broadcastMachineUpdate = async (machineId: number) => {
  try {
    const io = getIO();
    
    // 1. Pega o status público da máquina
    const publicStatus = await getMachineStatus(machineId);
    
    // 2. Emite o status público para a sala geral da máquina
    io.to(String(machineId)).emit('statusUpdate', publicStatus);

    // 3. Pega todos os usuários na fila para enviar status personalizado
    const queue = await MachineQueueModel.findByMachine(machineId);
    
    for (const item of queue) {
      const userId = item.userId;
      // Pega o status personalizado para cada usuário na fila
      const userSpecificStatus = await getMachineStatus(machineId, userId, 'user');
      // Emite para a sala específica do usuário
      io.to(`user_${userId}`).emit('statusUpdate', userSpecificStatus);
    }

    console.log(`📢 Atualização da máquina ${machineId} transmitida.`);

  } catch (error) {
    console.error(`❌ Erro ao transmitir atualização para a máquina ${machineId}:`, error);
  }
};