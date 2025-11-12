import React, { useState, useEffect } from 'react';
import { Machine } from '../types';
import { InputField } from './InputField';
import { Button } from './Button';

interface MachineFormProps {
  onSave: (machine: Omit<Machine, 'id' | 'status'>) => void;
  onCancel: () => void;
  initialData?: Omit<Machine, 'id' | 'status'>;
}

export const MachineForm: React.FC<MachineFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'lavadora' | 'secadora'>('lavadora');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setDefaultDuration(initialData.defaultDuration);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || defaultDuration <= 0) {
      setError('Por favor, preencha todos os campos corretamente.');
      return;
    }
    onSave({ name, type, defaultDuration });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        <InputField
          label="Nome da Máquina"
          type="text"
          value={name}
          onChange={(value) => setName(value)} // 🔥 CORRIGIDO
          placeholder="Ex: Lavadora #1"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Máquina</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'lavadora' | 'secadora')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="lavadora">Lavadora</option>
            <option value="secadora">Secadora</option>
          </select>
        </div>
        <InputField
          label="Duração Padrão (minutos)"
          type="number"
          value={defaultDuration.toString()}
          onChange={(value) => setDefaultDuration(parseInt(value, 10) || 0)} // 🔥 CORRIGIDO
        />
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};
