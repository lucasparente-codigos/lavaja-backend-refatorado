import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Button } from '../components/Button';
import { MachineDetailModal } from '../components/MachineDetailModal';

// Define types locally for now
interface Company {
  id: number;
  name: string;
  machinesAvailable: number;
  machinesInUse: number;
  machinesTotal: number;
}

interface Machine {
  id: number;
  name: string;
  type: 'lavadora' | 'secadora';
  status: 'disponivel' | 'em_uso' | 'manutencao';
  queueLength: number;
  currentUsage?: {
    estimatedEndTime: string;
    timeRemaining: number;
  };
}

const HomePage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<{ id: number; name: string } | null>(null);
  const [viewingMachineId, setViewingMachineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await api.get('/public/companies');
        if (response.data.success) {
          setCompanies(response.data.data);
        } else {
          setError(response.data.error || 'Falha ao buscar empresas.');
        }
      } catch (err) {
        setError('Ocorreu um erro ao conectar ao servidor.');
      } finally {
        setLoading(false);
      }
    };

    if (!selectedCompany) {
      fetchCompanies();
    }
  }, [selectedCompany]);

  const handleSelectCompany = async (company: { id: number; name: string }) => {
    setSelectedCompany(company);
    setLoading(true);
    try {
      const response = await api.get(`/public/companies/${company.id}/machines`);
      if (response.data.success) {
        setMachines(response.data.data.machines);
      } else {
        setError(response.data.error || 'Falha ao buscar máquinas.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setMachines([]);
  };

  const getStatusLabel = (status: Machine['status']) => {
    switch (status) {
      case 'disponivel': return <span className="font-bold text-green-500">Disponível</span>;
      case 'em_uso': return <span className="font-bold text-yellow-500">Em Uso</span>;
      case 'manutencao': return <span className="font-bold text-red-500">Manutenção</span>;
      default: return status;
    }
  };

  const renderCompanyList = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Lavanderias Disponíveis</h1>
      {companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
              <h2 className="text-xl font-bold mb-4">{company.name}</h2>
              <div className="flex-grow space-y-2 text-gray-600 mb-4">
                <p>Disponíveis: <span className="font-bold text-green-500">{company.machinesAvailable}</span></p>
                <p>Em Uso: <span className="font-bold text-yellow-500">{company.machinesInUse}</span></p>
                <p>Total: <span className="font-bold">{company.machinesTotal}</span></p>
              </div>
              <Button onClick={() => handleSelectCompany(company)}>
                Ver Máquinas
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhuma lavanderia encontrada.</p>
      )}
    </div>
  );

  const renderMachineList = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button onClick={handleBackToCompanies} variant="secondary">
          ← Voltar para Lavanderias
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-center">Máquinas em {selectedCompany?.name}</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Máquina</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Tempo Restante</th>
              <th className="py-3 px-4 text-center">Fila</th>
              <th className="py-3 px-4 text-center">Ação</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{machine.name} ({machine.type})</td>
                <td className="py-3 px-4">{getStatusLabel(machine.status)}</td>
                <td className="py-3 px-4">
                  {machine.status === 'em_uso' && machine.currentUsage
                    ? `${machine.currentUsage.timeRemaining} min`
                    : '-'}
                </td>
                <td className="py-3 px-4 text-center">{machine.queueLength}</td>
                <td className="py-3 px-4 text-center">
                  <Button size="sm" onClick={() => setViewingMachineId(machine.id)}>
                    Ver Detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
    <>
      {selectedCompany ? renderMachineList() : renderCompanyList()}

      {viewingMachineId && (
        <MachineDetailModal 
          machineId={viewingMachineId}
          onClose={() => setViewingMachineId(null)}
        />
      )}
    </>
  );
};

export default HomePage;