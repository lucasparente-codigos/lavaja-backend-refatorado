import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import { Machine, MachineStats } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { MachineForm } from '../components/MachineForm';

type ModalState = 'closed' | 'add' | 'edit';

const DashboardPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState<MachineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/machines');
      if (response.data.success) {
        setMachines(response.data.data.machines);
        setStats(response.data.data.stats);
      } else {
        setError(response.data.error || 'Falha ao buscar máquinas.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao conectar ao servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleSaveMachine = async (newMachineData: Omit<Machine, 'id' | 'status'>) => {
    try {
      const response = await api.post('/machines', newMachineData);
      if (response.data.success) {
        setModalState('closed');
        fetchMachines();
      } else {
        alert(`Erro: ${response.data.error}`);
      }
    } catch (err) {
      alert('Ocorreu um erro ao salvar a máquina.');
      console.error(err);
    }
  };

  const handleUpdateMachine = async (updatedMachineData: Omit<Machine, 'id' | 'status'>) => {
    if (!editingMachine) return;
    try {
      const response = await api.put(`/machines/${editingMachine.id}`, updatedMachineData);
      if (response.data.success) {
        setModalState('closed');
        setEditingMachine(null);
        fetchMachines();
      } else {
        alert(`Erro: ${response.data.error}`);
      }
    } catch (err) {
      alert('Ocorreu um erro ao atualizar a máquina.');
      console.error(err);
    }
  };

  const handleEditClick = (machine: Machine) => {
    setEditingMachine(machine);
    setModalState('edit');
  };

  const handleDeleteClick = async (machine: Machine) => {
    if (window.confirm(`Tem certeza que deseja deletar a máquina "${machine.name}"?`)) {
      try {
        const response = await api.delete(`/machines/${machine.id}`);
        if (response.data.success) {
          fetchMachines();
        } else {
          alert(`Erro: ${response.data.error}`);
        }
      } catch (err) {
        alert('Ocorreu um erro ao deletar a máquina.');
        console.error(err);
      }
    }
  };

  const handleStartUsage = async (machineId: number) => {
    try {
      const response = await api.post(`/usage/start/${machineId}`);
      if (response.data.success) {
        fetchMachines();
      } else {
        alert(`Erro: ${response.data.error}`);
      }
    } catch (err) {
      alert('Ocorreu um erro ao iniciar o uso da máquina.');
      console.error(err);
    }
  };

  const handleFinishUsage = async (machineId: number) => {
    if (window.confirm('Tem certeza que deseja finalizar o uso desta máquina? A fila pode ser acionada.')) {
      try {
        const response = await api.post(`/usage/machines/${machineId}/finish`);
        if (response.data.success) {
          fetchMachines();
        } else {
          alert(`Erro: ${response.data.error}`);
        }
      } catch (err) {
        alert('Ocorreu um erro ao finalizar o uso da máquina.');
        console.error(err);
      }
    }
  };

  const closeModal = () => {
    setModalState('closed');
    setEditingMachine(null);
  };

  const getStatusLabel = (status: Machine['status']) => {
    switch (status) {
      case 'disponivel':
        return <span className="text-green-500 font-bold">Disponível</span>;
      case 'em_uso':
        return <span className="text-yellow-500 font-bold">Em Uso</span>;
      case 'manutencao':
        return <span className="text-red-500 font-bold">Manutenção</span>;
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard da Empresa</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card title="Total" value={stats.total} />
          <Card title="Disponíveis" value={stats.available} />
          <Card title="Em Uso" value={stats.inUse} />
          <Card title="Manutenção" value={stats.maintenance} />
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalState('add')}>
          Adicionar Máquina
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Nome</th>
              <th className="py-3 px-4 text-left">Tipo</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-center">Operação</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {machines.length > 0 ? (
              machines.map((machine) => (
                <tr key={machine.id} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">{machine.name}</td>
                  <td className="py-3 px-4">{machine.type === 'lavadora' ? 'Lavadora' : 'Secadora'}</td>
                  <td className="py-3 px-4">{getStatusLabel(machine.status)}</td>
                  <td className="py-3 px-4 text-center">
                    {machine.status === 'disponivel' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleStartUsage(machine.id)}
                      >
                        Iniciar Uso
                      </Button>
                    )}
                    {machine.status === 'em_uso' && (
                      <Button 
                        variant="warning" 
                        size="sm" 
                        onClick={() => handleFinishUsage(machine.id)}
                      >
                        Finalizar
                      </Button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleEditClick(machine)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(machine)}
                      >
                        Deletar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  Nenhuma máquina cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Adicionar */}
      <Modal isOpen={modalState === 'add'} onClose={closeModal} title="Adicionar Nova Máquina">
        <MachineForm 
          onSave={handleSaveMachine}
          onCancel={closeModal}
        />
      </Modal>

      {/* Modal de Editar */}
      <Modal isOpen={modalState === 'edit'} onClose={closeModal} title="Editar Máquina">
        <MachineForm 
          onSave={handleUpdateMachine}
          onCancel={closeModal}
          initialData={editingMachine ?? undefined}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
