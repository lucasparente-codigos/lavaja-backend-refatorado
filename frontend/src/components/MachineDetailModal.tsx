import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Types should be centralized later
interface MachineDetails {
  machine: {
    id: number;
    name: string;
    type: 'lavadora' | 'secadora';
    status: 'disponivel' | 'em_uso' | 'manutencao';
  };
  currentUsage: {
    timeRemaining: number;
  } | null;
  queue: any[];
  myStatus: {
    inQueue: boolean;
    position: number | null;
    isNotified: boolean;
    expiresAt: string | null;
  } | null;
}

interface MachineDetailModalProps {
  machineId: number;
  onClose: () => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({ machineId, onClose }) => {
  const [details, setDetails] = useState<MachineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);

    // 🔥 CORRIGIDO: Remover /api da URL do WebSocket
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('Conectado ao WebSocket');
      socket.emit('subscribe', { machineId: machineId, userId: user?.id });
    });

    socket.on('statusUpdate', (newDetails: MachineDetails) => {
      console.log('Status atualizado:', newDetails);
      setDetails(newDetails);
      setLoading(false);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do WebSocket');
    });

    socket.on('connect_error', (err) => {
      console.error('Erro de conexão WebSocket:', err);
      setError('Erro de conexão com o servidor em tempo real.');
      setLoading(false);
    });

    // Initial fetch in case WebSocket takes time to connect or for initial data
    api.get(`/public/machines/${machineId}/status`)
      .then(response => {
        if (response.data.success) {
          setDetails(response.data.data);
        } else {
          setError(response.data.error);
        }
      })
      .catch(err => {
        setError('Erro ao buscar detalhes da máquina.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      console.log('Desconectando do WebSocket');
      socket.emit('unsubscribe', { machineId: machineId, userId: user?.id });
      socket.disconnect();
    };
  }, [machineId, user?.id]);

  const handleJoinQueue = async () => {
    try {
      const response = await api.post(`/queue/join/${machineId}`);
      if (!response.data.success) {
        alert(`Erro: ${response.data.error}`);
      }
    } catch (err) {
      alert('Não foi possível entrar na fila.');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      const response = await api.delete(`/queue/leave/${machineId}`);
      if (!response.data.success) {
        alert(`Erro: ${response.data.error}`);
      }
    } catch (err) {
      alert('Não foi possível sair da fila.');
    }
  };

  const renderContent = () => {
    if (loading) return <p>Carregando detalhes...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!details) return <p>Nenhum detalhe encontrado.</p>;

    const { machine, currentUsage, queue, myStatus } = details;

    return (
      <div className="space-y-4">
        <p><strong>Status:</strong> {machine.status}</p>
        {currentUsage && <p><strong>Tempo Restante:</strong> {currentUsage.timeRemaining} min</p>}
        <p><strong>Pessoas na Fila:</strong> {queue.length}</p>
        
        <hr className="my-4"/>

        {myStatus?.isNotified && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            <p className="font-bold">É a sua vez!</p>
            <p>Você tem um tempo limitado para iniciar o uso da máquina.</p>
          </div>
        )}

        {myStatus?.inQueue && !myStatus.isNotified && (
          <p><strong>Sua Posição na Fila:</strong> {myStatus.position}</p>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          {!myStatus?.inQueue && machine.status === 'em_uso' && (
            <Button onClick={handleJoinQueue}>Entrar na Fila</Button>
          )}
          {myStatus?.inQueue && (
            <Button onClick={handleLeaveQueue} variant="danger">Sair da Fila</Button>
          )}
          {machine.status === 'disponivel' && (
             <p className="text-green-600 font-bold">Máquina disponível para uso!</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={details?.machine.name || 'Detalhes da Máquina'}>
      {renderContent()}
    </Modal>
  );
};